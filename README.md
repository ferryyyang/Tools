<!--
 * @Description:
 * @version:
 * @Author: wangzhaorui
 * @Date: 2021-12-04 12:11:55
 * @LastEditors: wangzhaorui
 * @LastEditTime: 2022-02-10 22:54:41
-->

# Tools

- sys-playground update 2022/02/10

> 离线版 arcgis api 符号练兵场 (offline arcgis api for js) 4.7 symbols for playground

- js2shapeFile update 2021/12/04

> 原地址（source url）：https://github.com/borisdev/js2shapefile

> 扩展函数（extend function）: bH_Proto.createSaveControlExtend()，增加自动下载及 zip 格式（Add automatic download parameters and ZIP format parameters）

> 文件路径（file path）: js2shapefile/lib/FileSaveTools.js

```
 /**
 * createSaveControl 函数扩展
 * 增加两个参数：Added parameters
 * isAutoDownload(是否自动下载) add automatic download
 * isDownloadZip(是否下载zip格式) support ZIP format
 */
bH_Proto.createSaveControlExtend = function (locationDiv, append, isAutoDownload, isDownloadZip){

}
```

> TODO : 保存中文字符 （save chinese character）
