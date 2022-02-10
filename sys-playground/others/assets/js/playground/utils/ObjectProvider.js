/**
 * This module is used to provide stateful obj
 */
define([
  "sphinxxxx/vanilla-picker",
  "esri/Color",

  "esri-playground-js/utils/DataProvider",

  "dojo/Stateful",

  "dojo/_base/declare",

  "dojo/dom"
], function(Picker, Color, DataProvider, Stateful, declare, dom) {
  var objectProvider = {};

  var StatefulClass = declare([Stateful], {});

/**
 * @ignore
 */
function isBright(color) {
  // see http://www.w3.org/TR/AERT#color-contrast
  const yiq = color.r * 0.299 + color.g * 0.587 + color.b * 0.114;

  return yiq >= 127;
}

/**
 * @ignore
 */
function darker(color, factor = 1) {
  const darknessFactor = Math.pow(0.7, factor);

  return new Color([
    Math.round(color.r * darknessFactor),
    Math.round(color.g * darknessFactor),
    Math.round(color.b * darknessFactor),
    color.a
  ]);
}

/**
 * @ignore
 */
function brighter(color, factor = 1) {
  const brightnessFactor = Math.pow(0.7, factor),
    i = 30;

  let r = color.r,
    g = color.g,
    b = color.b;

  if (r < i) {
    r = i;
  }

  if (g < i) {
    g = i;
  }

  if (b < i) {
    b = i;
  }

  return new Color([
    Math.min(255, Math.round(r / brightnessFactor)),
    Math.min(255, Math.round(g / brightnessFactor)),
    Math.min(255, Math.round(b / brightnessFactor)),
    color.a
  ]);
}

/**
 * @ignore
 */
function getContrastingColor(color) {
  return isBright(color) ? darker(color) : brighter(color, 3);
}

  var getStatefullObject = function(configData) {
    var obj = new StatefulClass(),
      configName = configData["className"] || configData["name"];

    obj.set("className", configName);

    var properties = configData["properties"];
    properties.forEach(function(property) {
      var propName = property["name"],
        propType = property["type"],
        propValue = property["value"],
        propAttributes = property["attributes"],
        propDefault = property["default"],
        propVisibility = property["visibility"],
        el = dom.byId(property["domId"] + "-" + "ID");

      obj.set(propName, null);

      if (propType === "Number" || propType === "String") {
        if (propType === "Number" && propAttributes && propAttributes.min && propAttributes.max) {
          var rangeEl = dom.byId(property["domId"] + "-" + "RangeID");

          var isMSIE = /*@cc_on!@*/ 0;

          if (isMSIE) {
            // do IE-specific things
            rangeEl.addEventListener("change", function() {
              obj.set(propName, rangeEl.value);
            });
          } else {
            // do non IE-specific things
            rangeEl.addEventListener("input", function() {
              obj.set(propName, rangeEl.value);
            });
          }
        }

        // binding from object to element
        obj.watch(propName, function(name, oldValue, value) {
          if (propDefault && value === null) {
            el.value = propDefault;
          } else {
            el.value = value;
          }
          if (propAttributes && propAttributes.min && propAttributes.max) {
            rangeEl.value = el.value;
          }
          if (propName === "url") {
            var img = new Image();
            img.addEventListener("load", function() {
              obj.set("width", this.naturalWidth);
              obj.set("height", this.naturalHeight);
            });
            img.src = el.value;
          }
        });

        // binding from element to obj
        el.addEventListener(
          "change",
          function() {
            // input validation
            if (propType === "Number" && propAttributes && el.value < propAttributes.min) {
              var errMsg = dom.byId("msg");
              errMsg.innerHTML = propName + " cannot be less than " + propAttributes.min + "!";

              // create event
              var event = new Event("errMsg");

              // Dispatch the event.
              errMsg.dispatchEvent(event);

              obj.set(propName, null);
            } else {
              if (el.value == propDefault) {
                obj.set(propName, null);
              } else {
                obj.set(propName, el.value);
              }
            }

            if (propAttributes && propAttributes.min && propAttributes.max) {
              var rangeEl = dom.byId(property["domId"] + "-" + "RangeID");
              rangeEl.value = el.value;
            }

            if (propName === "url") {
              var img = new Image();
              img.addEventListener("load", function() {
                obj.set("width", this.naturalWidth);
                obj.set("height", this.naturalHeight);
              });
              img.src = el.value;
            }
          },
          false
        );

        if (propVisibility) {
          var visPropParent;
          properties.forEach(function(prop) {
            if (prop["name"] === propVisibility["name"]) {
              visPropParent = prop;
            }
          });

          var domElem = dom.byId(visPropParent["domId"] + "-" + "ID");
          var parentNode = el.parentNode.parentNode;

          if (domElem.value !== propVisibility["value"]) {
            parentNode.style.display = "none";
          }

          domElem.addEventListener("change", function() {
            if (domElem.value === propVisibility["value"]) {
              parentNode.style.display = "-webkit-box";
              parentNode.style.display = "-moz-box";
              parentNode.style.display = "-ms-flexbox";
              parentNode.style.display = "-webkit-flex";
              parentNode.style.display = "flex";
              if (propDefault !== undefined) {
                obj.set(propName, propDefault);
              }
            } else {
              parentNode.style.display = "none";
              obj.set(propName, null);
            }
          });
        }

        if (propValue) {
          obj.set(propName, propValue);
        }
      } else if (propType === "Boolean") {
        // binding from object to element
        obj.watch(propName, function(name, oldValue, value) {
          el.checked = value;
        });

        el.addEventListener(
          "change",
          function() {
            if (el.checked) {
              obj.set(propName, true);
            } else {
              obj.set(propName, false);
            }
          },
          false
        );
      } else if (propType === "Color") {
        var text = dom.byId(property["domId"] + "-" + "TextID");

        if (text) {
          var defVal = propDefault || [0, 0, 0, 1];
          var colorPicker = new Picker({
            parent: el,
            popup: false,
            alpha: true,
            editor: true,
            color: "white",
            onChange: colorChangeHandler
          });

          colorPicker.setColor(defVal);
          text.innerHTML = "[" + defVal + "]";
          text.style.background = new Color(defVal);

          function colorChangeHandler(event) {
            var selected = new Color(event.rgba);

            var textVal = selected.toRgba();
            textVal[3] = Math.round(textVal[3] * 100) / 100;

            var colorEquality = defVal.every(function(val, idx) {
              return val === textVal[idx] ? true : false;
            });

            if (colorEquality) {
              obj.set(propName, null);
            } else {
              obj.set(propName, textVal);
            }
          }

          // binding from object to element
          obj.watch(propName, function(name, oldValue, value) {
            //el.value = value;
            if (value === null) {
              value = defVal;
            }
            if (!oldValue) {
              colorPicker.setColor(value, true);
            }

            var selected = new Color(value);
            var contrastColor = getContrastingColor(selected);

            var textVal = selected.toRgba();
            textVal[3] = Math.round(textVal[3] * 100) / 100;

            if (textVal.constructor === Array) {
              textVal = "[" + textVal + "]";
            }

            text.innerHTML = textVal;
            text.style.background = selected;
            text.style.color = contrastColor;
          });
        }
      } else if (propType === "Class" || propType === "Object") {
        var config = property["config"] || property;

        if (config && config["properties"]) {
          obj.set(propName, getStatefullObject(config));

          var textElem = dom.byId(property["domId"] + "-" + "TextID"),
            text = [],
            subObj = obj[propName];

          config["properties"].forEach(function(prop) {
            var def = prop["default"];

            if (def != null) {
              if (typeof def === "number") {
                def = Math.round(def * 100) / 100;
              }
              if (def.constructor === Array) {
                def = "[" + def + "]";
              }
              text.push(def);
            } else {
              text.push(prop["name"]);
            }
          });

          textElem.innerHTML = text.join(", ");

          subObj.watch(function() {
            text = [];

            config["properties"].forEach(function(prop) {
              var def = subObj[prop["name"]] || prop["default"] || prop["name"];
              if (typeof def === "number") {
                def = Math.round(def * 100) / 100;
              }
              if (def.constructor === Array) {
                def = "[" + def + "]";
              }
              text.push(def);
            });

            textElem.innerHTML = text.join(", ");
          });
        }
      }
    });

    return obj;
  };

  objectProvider.getStatefullObject = getStatefullObject;
  objectProvider.StatefulClass = StatefulClass;

  return objectProvider;
});
