- [x] 4.x 加载天地图（建议服务器预览html，文件双击预览存在403异常）
- 测试至4.21版本

``` 
// 正确模板
var layer_img = new WebTileLayer({
    urlTemplate: "http://{subDomain}.tianditu.gov.cn/img_c/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=img&tileMatrixSet=c&TileMatrix={level}&TileRow={row}&TileCol={col}&style=default&format=tiles&tk=0dd7d7cd89b828227cf1e1176c2a42f5",
    subDomains: ['t0', 't1', 't2', 't3', 't4', 't5', 't6', 't7'],
    //subDomains: ['t0'],
    tileInfo: tileInfo,// 瓦片信息见下方
    spatialReference: {
        wkid: 4490
    },
    copyright: '1sd'
})
```

``` 
// 错误示例
var layer_anno = WebTileLayer(
    "http://{subDomain}.tianditu.gov.cn/cia_c/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cia&STYLE=default&TILEMATRIXSET=c&TILEMATRIX=${level}&TILEROW=${row}&TILECOL=${col}&FORMAT=tiles&tk=0dd7d7cd89b828227cf1e1176c2a42f5", {
    subDomains: ['t0', 't1', 't2', 't3', 't4', 't5', 't6', 't7'],
    //subDomains: ['t0'],
    tileInfo: tileInfo,
    spatialReference: {
         wkid: 4490
    }
})

```
- 错误一：未使用关键字new WebTileLayer() 后续版本报异常，4.7正常
- 错误二：new WebTileLayer()未使用属性格式 urlTemplate："http://{subDomain}..../"
- 错误三：urlTemplate中使用${}后续版本（要求为{}）报异常，4.7正常
- 错误四：new WebTileLayer() 有些需要指定坐标系，否则默认为102100（1984web墨卡托）而导致坐标系不匹配

```
// 注：瓦片信息，天地图经纬度地图的切片信息全部使用该信息设定
            var tileInfo = new TileInfo({
                dpi: 90.71428571427429,
                rows: 256,
                cols: 256,
                compressionQuality: 0,
                origin: {
                    x: -180,
                    y: 90
                },
                spatialReference: {
                    wkid: 4490
                },
                lods: [{
                        level: 2,
                        levelValue: 2,
                        resolution: 0.3515625,
                        scale: 147748796.52937502
                    },
                    {
                        level: 3,
                        levelValue: 3,
                        resolution: 0.17578125,
                        scale: 73874398.264687508
                    },
                    {
                        level: 4,
                        levelValue: 4,
                        resolution: 0.087890625,
                        scale: 36937199.132343754
                    },
                    {
                        level: 5,
                        levelValue: 5,
                        resolution: 0.0439453125,
                        scale: 18468599.566171877
                    },
                    {
                        level: 6,
                        levelValue: 6,
                        resolution: 0.02197265625,
                        scale: 9234299.7830859385
                    },
                    {
                        level: 7,
                        levelValue: 7,
                        resolution: 0.010986328125,
                        scale: 4617149.8915429693
                    },
                    {
                        level: 8,
                        levelValue: 8,
                        resolution: 0.0054931640625,
                        scale: 2308574.9457714846
                    },
                    {
                        level: 9,
                        levelValue: 9,
                        resolution: 0.00274658203125,
                        scale: 1154287.4728857423
                    },
                    {
                        level: 10,
                        levelValue: 10,
                        resolution: 0.001373291015625,
                        scale: 577143.73644287116
                    },
                    {
                        level: 11,
                        levelValue: 11,
                        resolution: 0.0006866455078125,
                        scale: 288571.86822143558
                    },
                    {
                        level: 12,
                        levelValue: 12,
                        resolution: 0.00034332275390625,
                        scale: 144285.93411071779
                    },
                    {
                        level: 13,
                        levelValue: 13,
                        resolution: 0.000171661376953125,
                        scale: 72142.967055358895
                    },
                    {
                        level: 14,
                        levelValue: 14,
                        resolution: 8.58306884765625e-005,
                        scale: 36071.483527679447
                    },
                    {
                        level: 15,
                        levelValue: 15,
                        resolution: 4.291534423828125e-005,
                        scale: 18035.741763839724
                    },
                    {
                        level: 16,
                        levelValue: 16,
                        resolution: 2.1457672119140625e-005,
                        scale: 9017.8708819198619
                    },
                    {
                        level: 17,
                        levelValue: 17,
                        resolution: 1.0728836059570313e-005,
                        scale: 4508.9354409599309
                    },
                    {
                        level: 18,
                        levelValue: 18,
                        resolution: 5.3644180297851563e-006,
                        scale: 2254.4677204799655
                    },
                    {
                        level: 19,
                        levelValue: 19,
                        resolution: 2.68220901489257815e-006,
                        scale: 1127.23386023998275
                    },
                    {
                        level: 20,
                        levelValue: 2,
                        resolution: 1.341104507446289075e-006,
                        scale: 563.616930119991375
                    }
                ]
            })
```
