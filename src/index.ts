import AliOSS from "ali-oss";
import { AxiosInstance } from "axios";
const CRM_TOKEN_KEY = "CRM_TOKEN_KEY";

let $http: AxiosInstance;
let url: string;
let fileObj: File;
let partSize: number;

interface IUploadPayload {
  file: File;
  cloudType?: string;
  sheetSize?: number;
}
// 将对象转成formData
function createFormData(config: object): object {
  const formData = new FormData();
  if (
    Object.prototype.toString.call(config) === "[object Object]" &&
    Object.keys(config).length > 0
  ) {
    Object.keys(config).forEach(key => formData.append(key, (config as any)[key]));
  }
  return formData;
}
// 获取上传的认证数据
function handleGetUpToken(ext: string, name: string, type: number, cloud: string | undefined): any {
  ext = ext.split("/")[1];
  // eslint-disable-next-line @typescript-eslint/camelcase
  const { klzz_ol_token, klzz_ol_uid, klzz_ol_time } = JSON.parse(
    localStorage.getItem(CRM_TOKEN_KEY) as any
  );
  return new Promise((resolve, reject) => {
    $http
      .post("/train/v1/alioss/get_oss_config", {
        driver: cloud || "aly_oss",
        klzzOlTime: klzz_ol_time,
        klzzOlToken: klzz_ol_token,
        klzzOlUid: klzz_ol_uid,
        ext: ext,
        name: name,
        type: type
      })
      .then((res: object) => {
        resolve(res);
      })
      .catch((err: string) => {
        reject(err);
      });
  });
}

//aliyun postObject 方式上传单个文件
function handleAliSingle(config: object): Promise<string> {
  const { bucket, region, path } = config as any;
  delete (config as any).bucket;
  delete (config as any).region;
  delete (config as any).path;
  const configData = createFormData(config);
  const url = `https://${bucket}.${region}.aliyuncs.com/`;
  const header = {
    headers: {
      contentType: "application/json;charset=UTF-8"
    }
  };
  return new Promise((resolve, reject) => {
    $http
      .post(url, configData, header)
      .then(res => {
        // 主工程axios里拦截器做了处理 此处res为data
        if ((res as any) === "") {
          const result = url + path;
          resolve(result);
        }
      })
      .catch(err => {
        reject(err);
      });
  });
}
// aliyun sdk 分片上传
async function multipartUpload(config: object): Promise<any> {
  const path = (config as any).path;
  delete (config as any).path;
  console.log(config, path);
  const client = new AliOSS(config as any);
  console.log(config, client, partSize, fileObj);

  const result = await client.multipartUpload(path, fileObj, {
    parallel: 5, //同时上传切片数量
    partSize: partSize
  });

  return (result.res as any).requestUrls[0];
}

async function uploadAliYun(config: object, flag: number): Promise<any> {
  if (flag === 1) {
    url = await multipartUpload(config);
  } else {
    url = await handleAliSingle(config);
  }
  return url;
}

function uploadTecentYun(config: object, flag: number): string {
  return "";
}

export async function uploadFlow(payload: IUploadPayload, _http: AxiosInstance): Promise<any> {
  $http = _http;
  // cloudType 腾讯云：tencent_oss；阿里云对象存储： aly_oss
  const { file, cloudType, sheetSize } = payload;
  fileObj = file;
  // 默认为0 不分片 1为分片
  let sheetFlag = 0;

  let config = {};
  //当为传入file 对象时终止上传流程
  if (!file) return;
  if (sheetSize && !isNaN(sheetSize) && file.size > sheetSize * 1024 * 1024) {
    partSize = sheetSize * 1024 * 1024;
    sheetFlag = 1;
  }
  // type 文件对象后缀  name 文件对象名称
  const { type, name } = file;
  const { code, data, message } = await handleGetUpToken(type, name, sheetFlag, cloudType);

  //根据sheetFlag 统一处理参数
  if (sheetFlag === 1) {
    //分片
    config = {
      accessKeyId: data.ossToken.accessKeyId,
      accessKeySecret: data.ossToken.accessKeySecret,
      bucket: data.bucket,
      region: data.region,
      stsToken: data.ossToken.securityToken,
      path: data.path
    };
  } else {
    config = {
      name: name,
      key: data.path,
      policy: data.webOssToken.policy,
      OSSAccessKeyId: data.webOssToken.accessid,
      success_action_status: "200",
      signature: data.webOssToken.signature,
      file: file,
      bucket: data.bucket,
      region: data.region,
      path: data.path
    };
  }

  if (code === 0) {
    if (cloudType === "tencent_oss") {
      url = uploadTecentYun(config, sheetFlag);
    } else {
      url = await uploadAliYun(config, sheetFlag);
    }
  } else {
    alert(message);
  }
  return url;
}
