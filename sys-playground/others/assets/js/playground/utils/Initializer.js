/*! ArcGIS API for JavaScript 4.17 | Copyright (c) 2020 Esri. All rights reserved. | http://www.esri.com/legal/privacy | https://developers.arcgis.com/terms/faq */
define(["require", "esri/Map", "esri/Color", "esri/Graphic", "esri/core/promiseUtils", "esri/views/MapView", "esri/views/SceneView", "esri/layers/GraphicsLayer", "esri/symbols/SimpleMarkerSymbol", "esri-playground-js/utils/CurrentState", "esri-playground-js/utils/CodeGenerator", "esri-playground-js/utils/geometryUtils", "esri-playground-js/utils/DOMBuilder", "esri-playground-js/utils/ObjectProvider", "esri-playground-js/utils/symbols/WebStyleSymbol", "dojo/dom", "dojo/on", "dojo/dom-construct", "dijit/registry", "prettier/prettier-helper"], function (require, Map, Color, Graphic, promiseUtils, MapView, SceneView, GraphicsLayer, SimpleMarkerSymbol, CurrentState, CodeGenerator, geometryUtils, DOMBuilder, ObjectProvider, WebStyleSymbolUtils, dom, on, domConstruct, registry, prettierHelper) {
    // 是否加载在线底图
    var isLoadBaseMap = true;
    var initializer = {},
        _views = {
            view2d: null,
            view3d: null
        },
        _maps = {
            map2d: null,
            map3d: null
        },
        _selectionGraphicsLayer = new GraphicsLayer,
        _playGraphicsLayer = new GraphicsLayer;
    var prettierOptions = Object.assign({}, prettierHelper.esriDefaultOptions, {
        parser: "babel"
    });
    var prettierJSONOptions = Object.assign({}, prettierHelper.esriDefaultOptions, {
        parser: "json"
    });
    var initViewHandlers = function () {
        var view2D = dom.byId("2d"),
            view3D = dom.byId("3d");
        var currentState = CurrentState.getInstance();
        var handle2D = on(view2D, "click", function (evt) {
            var state = CurrentState.getInstance();
            state.set("view", getView());
            _drawOnMap(state);
            evt.stopPropagation()
        });
        currentState.handles.add(handle2D, "2d-view");
        var handle3D = on(view3D, "click", function (evt) {
            var state = CurrentState.getInstance();
            state.set("view", getView(true));
            _drawOnMap(state);
            evt.stopPropagation()
        });
        currentState.handles.add(handle3D, "3d-view");
        var basemapSelector = dom.byId("basemapSelector");
        var handle = on(basemapSelector, "change", function () {
            var map2D = _getMap(),
                map3D = _getMap(true);
            map2D.basemap = basemapSelector.value;
            map3D.basemap = basemapSelector.value;
            sessionStorage.setItem("basemap", basemapSelector.value)
        });
        currentState.handles.add(handle, "basemap-selector")
    };
    var _getMap = function (is3D) {
        var layers = null;
        if (is3D) {
            if (_maps.map3d) {
                return _maps.map3d
            } else {
                layers = [new GraphicsLayer]
            }
        } else {
            if (_maps.map2d) {
                return _maps.map2d
            } else {
                layers = [_playGraphicsLayer, _selectionGraphicsLayer]
            }
        }
        var basemapSelector = dom.byId("basemapSelector"),
            lsBasemap = sessionStorage.getItem("basemap");
        if (basemapSelector.value === "topo" && lsBasemap) {
            basemapSelector.value = lsBasemap
        }

        if (!isLoadBaseMap) {
            return new Map({
                layers: layers
            })
        }

        return new Map({
            basemap: basemapSelector.value || "topo",
            layers: layers
        })
    };
    var getView = function (is3D) {
        var view2DBtn = dom.byId("2d"),
            view3DBtn = dom.byId("3d"),
            view2D = dom.byId("view2d"),
            view3D = dom.byId("view3d");
        if (is3D) {
            view2D.style.display = "none";
            view3D.style.display = "";
            view2DBtn.className = "";
            view3DBtn.className = "active";
            if (_views.view3d) {
                return _views.view3d
            } else {
                if (!_maps.map3d) {
                    _maps.map3d = _getMap(true)
                }
                return _views.view3d = new SceneView({
                    container: "view3d",
                    map: _maps.map3d,
                    camera: {
                        position: [-118.5, 22, 1032626],
                        tilt: 50,
                        zoom: 8
                    }
                })
            }
        } else {
            view2D.style.display = "";
            view3D.style.display = "none";
            view3DBtn.className = "";
            view2DBtn.className = "active";
            if (_views.view2d) {
                return _views.view2d
            } else {
                if (!_maps.map2d) {
                    _maps.map2d = _getMap()
                }
                return _views.view2d = new MapView({
                    container: "view2d",
                    center: [-118, 34.5],
                    zoom: 8,
                    map: _maps.map2d
                })
            }
        }
    };
    var _initCopy = function (domElem, input, isEditor) {
        ZeroClipboard.config({
            swfPath: require.toUrl("zeroclipboard") + "/ZeroClipboard.swf"
        });
        var client = new ZeroClipboard(domElem);
        client.on("ready", function () {
            client.on("copy", function (event) {
                event.clipboardData.setData("text/plain", isEditor ? input.getValue() : input.value)
            });
            client.on("aftercopy", function () {
                var msg = dom.byId("msg");
                msg.innerHTML = "Copied to clipboard!";
                var event = new Event("notification");
                msg.dispatchEvent(event)
            })
        });
        client.on("error", function () {
            ZeroClipboard.destroy()
        })
    };
    var initEditor = function () {
        var codeArea = dom.byId("code-area"),
            editor = CodeMirror.fromTextArea(codeArea, {
                theme: "monokai",
                lineNumbers: true,
                readOnly: true,
                gutters: ["CodeMirror-linenumbers"]
            });
        _initCopy(dom.byId("copyButton"), editor.getDoc(), true);
        editor.on("change", function (cm) {
            var editorValue = cm.getDoc().getValue();
            var state = CurrentState.getInstance();
            if (!_isJsonRegex(editorValue) && editorValue.indexOf("require([") === -1) {
                _drawOnMap(state);
                if (state.config["autocastType"]) {
                    _changeMenu(dom.byId("autocastOption"))
                } else {
                    _changeMenu(dom.byId("codeOption"))
                }
            }
        });
        var currentState = CurrentState.getInstance();
        currentState.set("editor", editor)
    };
    var _isJsonRegex = function (str) {
        if (str == "") {
            return false
        }
        str = str.replace(/\\./g, "@").replace(/"[^"\\\n\r]*"/g, "");
        return /^[,:{}\[\]0-9.\-+Eaeflnr-u \n\r\t]*$/.test(str)
    };
    var _drawOnMap = function () {
        var currentState = CurrentState.getInstance();
        var map = currentState.view.map,
            paths = currentState.required.paths,
            names = currentState.required.reqVariables,
            configData = currentState.config,
            code = CodeGenerator.generateCode(currentState.ast),
            graphicsLayer = map.layers.getItemAt(0);
        graphicsLayer.removeAll();
        var promises = [];
        paths.forEach(function (path) {
            promises.push(require(path))
        });
        promiseUtils.all(promises).then(function (result) {
            for (var i = 0; i < result.length; i++) {
                this[names[i]] = result[i]
            }
            var variableHolder = eval(code + configData["variable"]);
            var className = configData["className"];
            if (className.indexOf("Symbol") > -1) {
                var geometry = geometryUtils.getGeometry(className);
                if (code.indexOf("offset") > -1) {
                    var geoLocSym = new SimpleMarkerSymbol({
                        style: SimpleMarkerSymbol.STYLE_CIRCLE,
                        color: "black",
                        size: 5
                    });
                    var geoLocGraphic = new Graphic({
                        geometry: geometry,
                        symbol: geoLocSym
                    });
                    graphicsLayer.add(geoLocGraphic)
                }
                var graphic = new Graphic({
                    geometry: geometry,
                    symbol: variableHolder
                });
                graphicsLayer.add(graphic);
                var state = CurrentState.getInstance();
                if (className.indexOf("WebStyleSymbol") > -1) {
                    state.view.goTo({
                        center: [-117.9998834, 34.50012405],
                        zoom: 20,
                        heading: 30,
                        tilt: 75
                    })
                } else if (className.toLowerCase().indexOf("3d") > -1) {
                    state.view.goTo({
                        position: [-118.5, 22, 1032626],
                        tilt: 50,
                        zoom: 8,
                        heading: 0
                    })
                }
            }
        })
    };
    var _changeMenu = function (node) {
        var menu = dom.byId("codeBlockMenu");
        var children = menu.childNodes;
        for (var i = 0; i < children.length; i++) {
            if (children[i].className) {
                children[i].className = "";
                break
            }
        }
        if (node.id !== "copyButton") {
            node.className = "active"
        }
    };
    var initCodeBlockHandlers = function () {
        var currentState = CurrentState.getInstance();
        if (!currentState.config["autocastType"]) {
            dom.byId("autocastOption").style.display = "none"
        } else {
            dom.byId("autocastOption").style.display = "block"
        }
        var menu = dom.byId("codeBlockMenu");
        var handle = on(menu, "click", function (event) {
            var node = event.target;
            if (!node.id) {
                node = event.target.parentNode
            }
            _changeMenu(node);
            var state = CurrentState.getInstance();
            var code = CodeGenerator.generateCode(state.ast),
                configData = state.config,
                editor = state.editor;
            if (node.id === "codeOption") {
                editor.getDoc().setValue(state.required.commentReqModules.join("\n") + "\n\n" + prettierHelper.format(code, prettierOptions))
            } else if (node.id === "autocastOption") {
                var autocastAST = CodeGenerator.getAutocastAST(configData["variable"], configData["autocastType"], state.ast);
                var autocastCode = CodeGenerator.generateCode(autocastAST);
                editor.getDoc().setValue("// autocasts as new " + configData["className"] + "() \n\n" + prettierHelper.format(autocastCode, prettierOptions))
            } else if (node.id === "jsonOption") {
                var variableHolder = eval(code + configData["variable"]);
                if (variableHolder && variableHolder.type === "web-style-symbol") {
                    variableHolder.fetchSymbol().then(function (sym) {
                        editor.getDoc().setValue(prettierHelper.format(JSON.stringify(sym.toJSON()), prettierJSONOptions))
                    })
                } else {
                    editor.getDoc().setValue(prettierHelper.format(JSON.stringify(variableHolder.toJSON()), prettierJSONOptions))
                }
            }
        });
        currentState.handles.add(handle, "code-block-menu")
    };
    var _resetObj = function (obj) {
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop) && prop !== "_watchCallbacks" && prop !== "className") {
                if (obj[prop] instanceof Object && !(obj[prop] instanceof Array)) {
                    _resetObj(obj[prop])
                } else {
                    if (obj[prop]) {
                        obj.set(prop, null)
                    }
                }
            }
        }
    };
    var initResetBtnHandlers = function () {
        var currentState = CurrentState.getInstance();
        var configData = currentState.config,
            editor = currentState.editor;
        var handle = on(dom.byId("reset"), "click", function () {
            var state = CurrentState.getInstance();
            _resetObj(state.statefulObject);
            state.set("ast", CodeGenerator.getAST(configData["className"], configData["variable"]));
            var autocastType = configData["autocastType"];
            if (autocastType) {
                var autocastAST = CodeGenerator.getAutocastAST(configData["variable"], autocastType, state.ast);
                var autocastCode = CodeGenerator.generateCode(autocastAST);
                editor.getDoc().setValue("// autocasts as new " + configData["className"] + "() \n\n" + prettierHelper.format(autocastCode, prettierOptions))
            } else {
                var code = CodeGenerator.generateCode(state.ast);
                editor.getDoc().setValue(state.required.commentReqModules.join("\n") + "\n\n" + prettierHelper.format(code, prettierOptions))
            }
        });
        currentState.handles.add(handle, "reset");
        var shareHandle = on(dom.byId("share"), "click", function () {
            var state = CurrentState.getInstance();
            dom.byId("modalBlock").style.display = "block";
            dom.byId("shareInput").value = window.location.href + "?" + "state=" + JSON.stringify(state.statefulObject)
        });
        currentState.handles.add(shareHandle, "share");
        var shareCloseHandle = on(dom.byId("shareClose"), "click", function () {
            dom.byId("modalBlock").style.display = "none"
        });
        currentState.handles.add(shareCloseHandle, "shareClose");
        _initCopy(dom.byId("copyShare"), dom.byId("shareInput"))
    };
    var initMsgCenterHandlers = function () {
        var msg = dom.byId("msg"),
            parent = msg.parentNode;
        on(msg, "errMsg", function () {
            parent.style.display = "block";
            setTimeout(function () {
                parent.style.display = "none"
            }, 4e3)
        });
        on(msg, "notification", function () {
            parent.style.display = "block";
            setTimeout(function () {
                parent.style.display = "none"
            }, 4e3)
        })
    };
    var initSelectionHandlers = function (map, data) {
        var searchBtn = dom.byId("searchBtn"),
            subTitle = dom.byId("pageSubTitle"),
            searchContainer = dom.byId("searchContainer"),
            searchBox = dom.byId("searchBox"),
            selectionList = dom.byId("selectionList"),
            symbolsList = dom.byId("symbolsList"),
            symbolsInfo = data[0].list,
            graphicsLayer = _selectionGraphicsLayer;
        symbolsInfo.forEach(function (info) {
            var node = document.createElement("a");
            node.setAttribute("href", window.location.pathname + "#/config=" + info.location);
            node.innerHTML = info.name;
            selectionList.appendChild(node);
            symbolsList.appendChild(node.cloneNode(true));
            var geoLocGraphic = new Graphic({
                geometry: geometryUtils.getGeometry(info.name),
                symbol: geometryUtils.getSymbol(info.name)
            });
            on(node, "mouseenter, mouseleave", function (event) {
                event.preventDefault();
                graphicsLayer.removeAll();
                if (event.type === "mouseenter" && info.type === "2d") {
                    graphicsLayer.add(geoLocGraphic)
                }
                event.stopPropagation()
            })
        });
        on(searchBtn, "click", function () {
            pageTitle.style.display = "none";
            subTitle.style.display = "none";
            searchContainer.style.display = "inline";
            searchBox.focus();
            event.stopPropagation()
        });
        on(document, "click", function () {
            pageTitle.style.display = "inline";
            subTitle.style.display = "inline";
            searchContainer.style.display = "none"
        });
        on(searchBox, "keyup", function () {
            var filter = searchBox.value.toLowerCase(),
                a = symbolsList.getElementsByTagName("a");
            for (var i = 0; i < a.length; i++) {
                if (a[i].href.toLowerCase().indexOf(filter) > -1) {
                    a[i].style.display = ""
                } else {
                    a[i].style.display = "none"
                }
            }
        })
    };
    var clearGraphicsLayer2D = function () {
        _playGraphicsLayer.removeAll()
    };
    var init = function () {
        var state = CurrentState.getInstance();
        initViewHandlers();
        initEditor();
        var configData = state.config,
            fragment = DOMBuilder.getMainfragment(configData);
        dom.byId("playArea").appendChild(fragment);
        state.view.when(function () {
            var currentState = CurrentState.getInstance();
            currentState.set("ast", CodeGenerator.getAST(configData["className"], configData["variable"]));
            if (!currentState.statefulObject) {
                currentState.set("statefulObject", ObjectProvider.getStatefullObject(configData))
            }
            var symbolName = configData["className"];
            if (symbolName === "PictureMarkerSymbol" && currentState.statefulObject.url == null) {
                currentState.statefulObject.set("url", "https://arcgis.github.io/arcgis-samples-javascript/sample-data/cat3.png")
            } else if (symbolName === "TextSymbol" && currentState.statefulObject.text == null) {
                currentState.statefulObject.set("text", "Sample Text")
            } else if (symbolName === "PictureFillSymbol" && currentState.statefulObject.url == null) {
                currentState.statefulObject.set("url", "https://arcgis.github.io/arcgis-samples-javascript/sample-data/cat3.png")
            } else if (symbolName === "WebStyleSymbol") {
                WebStyleSymbolUtils.init()
            }
            initCodeBlockHandlers();
            initResetBtnHandlers()
        })
    };
    var reset = function () {
        var currentState = CurrentState.getInstance();
        domConstruct.empty("playArea");
        if (currentState.editor) {
            domConstruct.destroy(currentState.editor.getWrapperElement())
        }
        registry.toArray().forEach(function (widget) {
            if (widget.title === "color-picker") {
                widget.destroy(true)
            }
        });
        CurrentState.destroy()
    };
    initializer.getView = getView;
    initializer.clearGraphicsLayer2D = clearGraphicsLayer2D;
    initializer.init = init;
    initializer.reset = reset;
    initializer.initMsgCenterHandlers = initMsgCenterHandlers;
    initializer.initSelectionHandlers = initSelectionHandlers;
    return initializer
});