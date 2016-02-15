/**
 * origin :
 *  1. https://github.com/artwl/Lottery
 *  2. https://github.com/lwzhang/scratch
 *
 * Modified by luohao
 *
 * */

(function(){

    /**
     * options : {
     *  id : String,//容器ID,位置已经定位
     *  cover : String,//蒙版颜色值字符串或者图片url
     *  coverType : String,//蒙版类型
     *  coverText : String,//显示蒙版文字
     *  coverTextColor : String,//蒙版文字颜色
     *  bgBg : String,//背景层的背景颜色值字符串或者图片url
     *  bgBgType : String,//背景层背景的类型
     *  width : Number,//宽
     *  height : Number,//高
     *  drawPercentCallback : Function( arg1 ),//刮开的区域占整个区域的回调,arg1是整个区域的百分比
     *  drawResultPercentCallback : Function( arg1 )//刮开结果区的回调，arg1是百分比
     * }
     * */

    var Lottery = window.Lottery = function ( options ) {
        this.conId = options.id;
        this.conNode = document.getElementById( this.conId );
        this.cover = options.cover || '#787f85';
        this.coverType = options.coverType || 'color';
        this.coverText = options.coverText;
        this.coverTextFontSize = options.coverTextFontSize || 22;
        this.coverTextColor = options.coverTextColor || '#EC6865';

        this.bgBg = options.bgBg || '#BDC7D1';
        this.bgBgType = options.bgBgType || 'color';

        this.background = null;
        this.backCtx = null;
        this.mask = null;
        this.maskCtx = null;
        this.lottery = null;
        this.lotteryType = 'image';
        this.width = options.width || this.conNode.clientWidth ||300;
        this.height = options.height || this.conNode.clientHeight || 100;
        this.clientRect = null;
        this.drawPercentCallback = options.drawPercentCallback;//整个画布区域区域百分比
        this.drawResultPercentCallback = options.drawResultPercentCallback;

        this.defaultFontFamily = '"PingFang SC Bold","黑体", "微软正黑体", Helvetica, Arial, "Hiragino Sans GB", "Microsoft Yahei", "微软雅黑", STHeiti, "华文细黑", sans-serif';
    };

    Lottery.prototype = {
        createElement: function (tagName, attributes) {
            var ele = document.createElement(tagName);
            for (var key in attributes) {
                ele.setAttribute(key, attributes[key]);
            }
            return ele;
        },

        getTransparentPercent: function(ctx, x, y, width, height) {
            var imgData = ctx.getImageData(x, y, width, height),
                pixles = imgData.data,
                transPixs = [];
            for (var i = 0, j = pixles.length; i < j; i += 4) {
                var a = pixles[i + 3];
                if (a < 128) {
                    transPixs.push(i);
                }
            }
            return ( transPixs.length / ( pixles.length / 4 ) * 100 ).toFixed(2);
        },

        resizeCanvas: function (canvas, width, height) {
            canvas.width = width;
            canvas.height = height;
            canvas.getContext('2d').clearRect( 0, 0, width, height );
        },

        drawPoint: function (x, y) {
            this.maskCtx.beginPath();
            var radgrad = this.maskCtx.createRadialGradient(x, y, 0, x, y, 30);
            radgrad.addColorStop(0, 'rgba(0,0,0,0.6)');
            radgrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
            this.maskCtx.fillStyle = radgrad;
            this.maskCtx.arc(x, y, 30, 0, Math.PI * 2, true);
            this.maskCtx.fill();

            if ( this.drawPercentCallback ) {
                this.drawPercentCallback.call(null, this.getTransparentPercent(this.maskCtx, 0, 0, this.width, this.height));
            }

            if( this.drawResultPercentCallback ){
                this.drawResultPercentCallback.call(
                    null,
                    this.getTransparentPercent(
                        this.maskCtx,
                        this.lotteryTextPos.x ,
                        this.lotteryTextPos.y,
                        this.lotteryTextPos.width,
                        this.lotteryTextPos.height
                    )
                );
            }
        },

        bindEvent: function () {
            var _this = this;
            var device = (/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent.toLowerCase()));
            var clickEvtName = device ? 'touchstart' : 'mousedown';
            var moveEvtName = device? 'touchmove': 'mousemove';
            if (!device) {
                var isMouseDown = false;
                document.addEventListener('mouseup', function(e) {
                    isMouseDown = false;
                }, false);
            } else {
                document.addEventListener("touchmove", function(e) {
                    if (isMouseDown) {
                        e.preventDefault();
                    }
                }, false);
                document.addEventListener('touchend', function(e) {
                    isMouseDown = false;
                }, false);
            }
            this.mask.addEventListener(clickEvtName, function (e) {
                isMouseDown = true;
                var docEle = document.documentElement;
                if (!_this.clientRect) {
                    _this.clientRect = {
                        left: 0,
                        top:0
                    };
                }
                var x = (device ? e.touches[0].clientX : e.clientX) - _this.clientRect.left + docEle.scrollLeft - docEle.clientLeft;
                var y = (device ? e.touches[0].clientY : e.clientY) - _this.clientRect.top + docEle.scrollTop - docEle.clientTop;
                _this.drawPoint(x, y);
            }, false);

            this.mask.addEventListener(moveEvtName, function (e) {
                if (!device && !isMouseDown) {
                    return false;
                }
                var docEle = document.documentElement;
                if (!_this.clientRect) {
                    _this.clientRect = {
                        left: 0,
                        top:0
                    };
                }
                var x = (device ? e.touches[0].clientX : e.clientX) - _this.clientRect.left + docEle.scrollLeft - docEle.clientLeft;
                var y = (device ? e.touches[0].clientY : e.clientY) - _this.clientRect.top + docEle.scrollTop - docEle.clientTop;
                _this.drawPoint(x, y);
            }, false);
        },

        drawLottery: function () {
            this.background = this.background || this.createElement('canvas', {
                    style: 'position:absolute;left:0;top:0;'
                });
            this.mask = this.mask || this.createElement('canvas', {
                    style: 'position:absolute;left:0;top:0;'
                });

            if (!this.conNode.innerHTML.replace(/[\w\W]| /g, '')) {
                this.conNode.appendChild(this.background);
                this.conNode.appendChild(this.mask);
                this.clientRect = this.conNode ? this.conNode.getBoundingClientRect() : null;
                this.bindEvent();
            }

            this.backCtx = this.backCtx || this.background.getContext('2d');
            this.maskCtx = this.maskCtx || this.mask.getContext('2d');

            if (this.lotteryType == 'image') {
                var image = new Image(),
                    _this = this;
                image.onload = function () {
                    _this.width = this.width;
                    _this.height = this.height;
                    _this.resizeCanvas(_this.background, this.width, this.height);
                    _this.backCtx.drawImage(this, 0, 0);
                    _this.drawMask();
                };
                image.src = this.lottery;
            } else if (this.lotteryType == 'text') {
                this.resizeCanvas(this.background, this.width, this.height);
                this.backCtx.save();

                //background
                if( this.bgBgType == 'color' ){
                    this.backCtx.fillStyle = this.bgBg;
                    this.backCtx.fillRect(0, 0, this.width, this.height);
                    this.backCtx.globalCompositeOperation = 'destination-out';

                }else if( this.bgBgType == 'image' ){
                    // ...
                }

                this.backCtx.restore();


                this.backCtx.save();
                var fontSize = this.lotteryFontSize;
                this.backCtx.font = 'Bold ' + fontSize + 'px ' + this.defaultFontFamily;
                this.backCtx.textAlign = 'center';
                this.backCtx.fillStyle = this.lotteryColor;

                var textWidth = fontSize * this.lottery.length;
                this.lotteryTextPos = {
                    x : this.width / 2 - textWidth / 2,
                    y : this.height / 2 - fontSize / 2,
                    width : textWidth,
                    height : fontSize
                };

                this.backCtx.fillText( this.lottery, this.width / 2, this.height / 2 + fontSize / 2 );
                this.backCtx.restore();

                this.drawMask();
            }
        },

        _drawMaskText : function(){
            var fontSize = this.coverTextFontSize;
            this.maskCtx.font = 'Bold ' + fontSize + 'px ' + this.defaultFontFamily;
            this.maskCtx.textAlign = 'center';
            this.maskCtx.fillStyle = this.coverTextColor;
            this.maskCtx.fillText( this.coverText, this.width / 2, this.height / 2 + fontSize / 2 );

        },

        drawMask: function() {
            this.resizeCanvas(this.mask, this.width, this.height);

            //cover mask
            if (this.coverType == 'color') {

                this.maskCtx.fillStyle = this.cover;
                this.maskCtx.fillRect(0, 0, this.width, this.height);

                this._drawMaskText();

                this.maskCtx.globalCompositeOperation = 'destination-out';

            } else if (this.coverType == 'image'){
                var image = new Image(),
                    _this = this;
                image.onload = function () {
                    _this.maskCtx.drawImage(this, 0, 0);
                    _this._drawMaskText();
                    _this.maskCtx.globalCompositeOperation = 'destination-out';
                };
                image.src = this.cover;
            }
        },

        /** lottery :String required 内容或图片url
         *  lotteryType : String 'image' 或者 'text', 默认为text
         * */
        init: function ( options ) {
            this.lottery = options.lottery;
            this.lotteryType = options.lotteryType || 'text';
            this.lotteryColor = options.lotteryColor || '#FCF008';//如果是文字，则有颜色
            this.lotteryFontSize = options.lotteryFontSize || 22;

            this.drawPercentCallback = options.drawPercentCallback || this.drawPercentCallback;//整个画布区域区域百分比
            this.drawResultPercentCallback = options.drawResultPercentCallback || this.drawResultPercentCallback;

            this.drawLottery();
        }
    };

})();
