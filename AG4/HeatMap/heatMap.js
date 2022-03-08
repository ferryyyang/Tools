/*
 * @Description: 
 * @version: 
 * @Author: wangzhaorui
 * @Date: 2022-03-08 23:32:04
 * @LastEditors: wangzhaorui
 * @LastEditTime: 2022-03-08 23:32:07
 */
// canvas 热力图测试
/**
 * 热力图 heatmap with arcgis api for js 4.17
 */
class HeatLayer {
    view: any
    config: any
    canvas: any
    context: any
    minnum: number
    visible: boolean
    maxnum: number
    data: any

    constructor(obj: any) {
        this.view = obj.view
        this.config = obj.config
        this.canvas = null
        this.context = null
        this.minnum = 1
        this.maxnum = 1
        this.visible = true
        this.createCanvas()
    }

    /*创建Canvaslayer的容器canvas，添加到map的layers下面*/
    createCanvas() {
        const canvas = document.createElement('canvas')
        canvas.width = this.view.width
        canvas.height = this.view.height
        canvas.setAttribute('id', 'heatmap')
        canvas.style.position = 'absolute'
        canvas.style.top = '0'
        canvas.style.left = '0'
        const parent = document.getElementsByClassName('esri-view-surface')[0]
        parent.appendChild(canvas)
        this.canvas = canvas
        let heatmapCanvas: any = {}
        heatmapCanvas = document.getElementById('heatmap')
        this.context = heatmapCanvas.getContext('2d')
        this.startMapEventListeners()
    }

    /*添加视图监听*/
    startMapEventListeners() {
        const view = this.view
        view.watch(
            'extent',
            lang.hitch(this, () => {
                if (!this.visible) return
                this.freshenLayer()
            })
        )

        view.watch(
            'camera',
            lang.hitch(this, () => {
                if (!this.visible) return
                this.freshenLayer()
            })
        )
    }

    /*刷新layer*/
    freshenLayer() {
        this.clearCanvas()
        this.addPoint(this.data)
    }

    /*清除渲染效果*/
    clearCanvas() {
        this.context.clearRect(0, 0, this.view.width, this.view.height)
    }

    /*转换数据*/
    convertHeatmapData(data: any) {
        const heatPluginData = []
        for (let i = 0; i < data.length; i++) {
            const screenpoint = this.view.toScreen({
                x: data[i][0],
                y: data[i][1],
                spatialReference: {
                    wkid: this.view.spatialReference.wkid
                }
            })

            //console.log(screenpoint)
            // 判断数据是否带有权重，未带有权重属性是默认为1
            if (data[0].length === 3) {
                heatPluginData.push([Math.round(screenpoint.x), Math.round(screenpoint.y), data[i][2]])
            } else {
                heatPluginData.push([Math.round(screenpoint.x), Math.round(screenpoint.y), 1])
            }

            if (this.minnum > data[i][2]) {
                this.minnum = data[i][2]
            }

            if (this.maxnum < data[i][2]) {
                this.maxnum = data[i][2]
            }
        }

        return {
            points: heatPluginData,
            min: this.minnum,
            max: this.maxnum
        }
    }

    //添加点数据
    addPoint(data) {
        this.data = data
        const points = this.convertHeatmapData(data)
        //console.log(points)
        points.points.forEach(point => {
            this.context.beginPath()
            const alpha = (point[2] - points.min) / (points.max - points.min)
            this.context.globalAlpha = alpha
            this.context.arc(point[0], point[1], this.config.radius, 0, Math.PI * 2, true)

            //绘制一个放射渐变样式的圆
            const gradient = this.context.createRadialGradient(
                point[0],
                point[1],
                0,
                point[0],
                point[1],
                this.config.radius
            )
            gradient.addColorStop(0, 'rgba(0,0,0,1)')
            gradient.addColorStop(1, 'rgba(0,0,0,0)')
            this.context.fillStyle = gradient
            this.context.closePath()
            this.context.fill()
        })

        this.MapColors()
    }

    //映射颜色
    MapColors() {
        const palette = this.getColorPaint()
        const img = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height)
        const imgData = img.data
        for (let i = 0; i < imgData.length; i++) {
            const alpha = imgData[i]
            const offset = alpha * 4
            if (!offset) {
                continue
            }

            //映射颜色RGB值
            imgData[i - 3] = palette[offset]
            imgData[i - 2] = palette[offset + 1]
            imgData[i - 1] = palette[offset + 2]
        }
        this.context.putImageData(img, 0, 0, 0, 0, this.canvas.width, this.canvas.height)
    }

    //设置渐变色带
    getColorPaint() {
        const paletteCanvas = document.createElement('canvas')
        const paletteCtx = paletteCanvas.getContext('2d')
        const gradientConfig = this.config.gradient
        paletteCanvas.width = 256
        paletteCanvas.height = 1
        const gradient = paletteCtx.createLinearGradient(0, 0, 256, 1)
        for (const key in gradientConfig) {
            gradient.addColorStop(Number(key), gradientConfig[key])
        }

        paletteCtx.fillStyle = gradient
        paletteCtx.fillRect(0, 0, 256, 1)
        return paletteCtx.getImageData(0, 0, 256, 1).data
    }
}

// canvas 热力图测试
function testHeatMap() {
    const viewDivId = 'map_main'
    const viewTemp = EsriMapUtil.getViewById(viewDivId)

    const config = {
        radius: 15,
        gradient: {
            '0.2': 'rgba(0,0,255,0.2)',
            '0.3': 'rgba(43,111,231,0.3)',
            '0.4': 'rgba(2,192,241,0.4)',
            '0.6': 'rgba(44,222,148,0.6)',
            '0.8': 'rgba(254,237,83,0.8)',
            '0.95': 'rgba(255,118,50,0.9)',
            '1': 'rgba(255,64,28,1)'
        }
    }

    const heatmap = new HeatLayer({
        view: viewTemp,
        config
    })

    const testPoints = [
        ['118.66124335378005', '28.92588513213444', 40],
        ['118.08115584871544', '29.04952406765118', 66],
        ['118.38722644164108', '29.059406055009923', 32],
        ['118.41649535128697', '29.135673493885232', 80],
        ['118.55019107002441', '29.300640724771107', 25],
        ['118.57374080604751', '28.685810835578355', 76],
        ['118.70453463048833', '28.824715624332843', 58],
        ['118.86481914446486', '28.946912041540134', 67],
        ['118.8727276271301', '28.972530779387345', 100]
    ]

    // 生成测试数据
    const xmin = viewTemp.extent.xmin
    const xmax = viewTemp.extent.xmax
    const ymin = viewTemp.extent.ymin
    const ymax = viewTemp.extent.ymax
    for (let i = 0; i < 100; i++) {
        const xTemp = Math.random() * (xmax - xmin) + xmin
        const yTemp = Math.random() * (ymax - ymin) + ymin
        const vTemp = Math.floor(Math.random() * 100)
        testPoints.push([xTemp, yTemp, vTemp])
    }
    heatmap.addPoint(testPoints)
}