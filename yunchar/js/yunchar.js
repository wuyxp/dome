/**
 * Created by wuyang on 16/5/8.
 */


//兼容requestAnimationFrame
window.requestAnimFrame = (function(){
    return  window.requestAnimationFrame       ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame    ||
        function( callback ){
            window.setTimeout(callback, 1000 / 60);
        };
})();

/**
 * Created by wuyang on 16/5/8.
 */

//数据折线构造函数
function createDataMap(gd,cm,ox,oy,w,h,MULTIPLE){
    this.ox = ox;
    this.oy = oy;
    this.w = w;
    this.h = h;
    this.gd = gd;
    this.gd.DataMap = [];

    this.cm = cm; // 坐标轴对象作为参数传入hoverDataMap对象中
    this.imagebg; // 预留一张没有数据的图片作为背景

    this.max; //数据集体里最大的数

    this._cacheData=[];//将drawDataMap的值放到缓存里,回头集体画出来.

    //启动表格的鼠标移动事件
    this.oHover = new hoverDataMap(gd,this.cm,ox,oy,w,h,MULTIPLE);

}

//将所有数据设置到内存上
createDataMap.prototype.drawDataMap = function(color,data){
    var dataMap = {};

    var resdata = data;
    var l = resdata.length;
    var m = Math.max.apply(null,resdata);

    dataMap.color = color;

    dataMap.resdata = resdata;


    this.gd.DataMap.push(dataMap); //将所有data数据添加道dataMap对象上

    this.imagebg = this.cm.getImageBackground(this.gd);

    this.setCacheData(dataMap);



};

createDataMap.prototype.setCacheData = function(cache){
    this._cacheData.push(cache);
};
createDataMap.prototype.getCacheData = function(){
    return this._cacheData;
};


//启动画
createDataMap.prototype.starDraw = function(animation){

    var animation = animation; //是否动画启动数据
    var aData = this.getCacheData();

    this.max = this.setScale(aData);

    if(animation){
        this.animation(aData,function () {
            this.oHover.init();
        });
    }else{
        //直接画时,将画图的上下文传递过去.在生成图片时能够直接用到
        this.drawLine(this.gd,aData,function(){

            this.oHover.init();
        });
    }
};

//设置所有的数据比例,并且返回最大值
createDataMap.prototype.setScale = function(adata){
    //需要找一下aData里面数据的最大值
    var max = 0,m;
    for(var i=0;i<adata.length;i++){
        max = max > (m = Math.max.apply(null,adata[i].resdata)) ? max : m;
    }

    for(var i=0;i<adata.length;i++){
        adata[i]["d"] = {};
        for(var j=0,l=adata[i].resdata.length;j<l;j++){
            var y = ((max-adata[i].resdata[j])/max)*this.h+this.oy;
            var x = j/l*this.w+this.ox;
            adata[i]["d"][parseInt(x)] = {};
            adata[i]["d"][parseInt(x)].v = adata[i].resdata[j];
            adata[i]["d"][parseInt(x)].x = x;
            adata[i]["d"][parseInt(x)].y = y;
        }

    }
    return max;
}

//直接画
createDataMap.prototype.drawLine = function(gd,adata,cbfun){

    var cbfun = cbfun || function(){};
    
    for(var d=0,dl=adata.length;d<dl;d++){
        gd.save();
        gd.beginPath();
        gd.translate(0.5,0.5);
        gd.lineWidth = 3;

        var resdata = adata[d].resdata;;
        var lint_s = 0;
        var l = resdata.length;
        var m = this.max;
        gd.strokeStyle = adata[d].color;
        for(var i=0;i<l;i++){
            if(resdata[i] === null) {
                lint_s = 0;
            }else{
                var y = ((m-resdata[i])/m)*this.h+this.oy;
                var x = i/l*this.w+this.ox;
                if(lint_s === 0){
                    gd.moveTo(x,y);
                }else{
                    gd.lineTo(x,y);
                }
                lint_s++;
            }


        }
        gd.stroke();
        gd.restore();
    }

    cbfun.apply(this);
}

//带有动画的画
createDataMap.prototype.animation = function(adata,cbfun){
    var _this = this;
    var timer = null;
    var state_x=1;
    var cbfun = cbfun || function(){};
    //初始化的线运动
    function ss(){

        var start_x = _this.ox;
        var start_y = _this.oy+_this.h/2;
        var end_x = _this.ox + _this.w;
        var end_y = start_y;
        state_x++;
        var _x = Math.tween.Quad.easeInOut(state_x,start_x,end_x,50);

        _this.gd.save();
        _this.gd.beginPath();
        _this.gd.translate(0.5,0.5);
        _this.gd.lineWidth = 3;
        _this.gd.strokeStyle = adata[0].color;
        _this.gd.moveTo(start_x,start_y);
        _this.gd.lineTo(_x,end_y);
        _this.gd.stroke();
        _this.gd.restore();
        if(_x>=end_x){
            //cbfun.apply(_this);
            moveLine.apply(_this);
            return false;
        }
        requestAnimFrame(ss);
    }
    ss();

    //从线变为折线的运动

    function moveLine(){
        var state_y = 1;
        var _this = this;

        function moveLineSs(){

            _this.cm.clearMap(_this.gd);
            _this.cm.setImageBackground(_this.gd,_this.imagebg);

            //遍历每一条线

            for(var i=0,a_i=adata.length;i<a_i;i++){

                _this.gd.save();
                _this.gd.beginPath();
                _this.gd.translate(0.5,0.5);
                _this.gd.lineWidth = 3;
                _this.gd.strokeStyle = adata[i].color;

                //遍历线上每一个值
                var resdata = adata[i].resdata;
                var lint_s = 0;
                for(var j=0,a_j=resdata.length;j<a_j;j++){

                    var m = _this.max;
                    if(resdata[j] === null) {
                        lint_s = 0;
                    }else {
                        var _y = ((m - resdata[j]) / m) * _this.h + _this.oy;
                        var start_y = _this.oy + _this.h / 2;
                        var y = Math.tween.Quad.easeInOut(state_y, start_y, _y - start_y, 100);
                        var x = j / a_j * _this.w + _this.ox;

                        if (lint_s == 0) {
                            _this.gd.moveTo(x, y);
                        } else {
                            _this.gd.lineTo(x, y);
                        }
                        lint_s++;



                    }
                }

                _this.gd.stroke();
                _this.gd.restore();

            }

            if (state_y >= 100 || state_y <= -100) {
                cbfun.apply(_this);
                return false;
            } else {
                state_y++;

            }



            requestAnimFrame(moveLineSs);
        }
        moveLineSs();
    }
};


//获取数据线的缩略图


createDataMap.prototype.getDataImage = function(){
    var _src = [];
    var oC = document.createElement("canvas");
    oC.width = this.gd.canvas.width;
    oC.height = this.gd.canvas.height;
    var oCG = oC.getContext("2d");
    var i=0,l=this.getCacheData().length;
    for(;i<l;i++){
        var tmap = [];
        var oSrc = {}

        tmap.push(this.getCacheData()[i]);
        oCG.clearRect(0,0,oC.width,oC.height);
        this.drawLine(oCG,tmap,function(){});
        oSrc.src = oC.toDataURL("image/png");
        oSrc.title = tmap[0].display_name;
        _src.push(oSrc);
    };

    return _src;
}


















/**
 * Created by wuyang on 16/5/8.
 */
/*
创建坐标轴的
 */

function createMap(json,gd,MULTIPLE){
    this.ox = json.ox * MULTIPLE;
    this.oy = json.oy * MULTIPLE;
    this.x = json.x;
    this.y = json.y;
    
    this.tip; //坐标轴提示框的文字

    this.endx = this.ox+this.x.len* MULTIPLE;
    this.endy = this.oy-this.y.len* MULTIPLE;

    this.init(gd);



};

//初始化坐标轴的各个细节
createMap.prototype.init = function(gd){

    //横竖坐标轴
    this.drawLine(gd,this.ox,this.oy,this.ox,this.endy,"#cfcfcf");
    this.drawLine(gd,this.ox,this.oy,this.endx,this.oy,"#cfcfcf");

    //坐标两边端点文字
    this.drawExplain(gd,this.ox-10,this.endy,this.x.text.substring(0,2));
    this.drawExplain(gd,this.ox-10,this.endy+40,this.x.text.substring(2));

    this.drawExplain(gd,this.endx,this.oy+10,this.y.text);

    //坐标刻度文字
    if(this.y.scale){
        this.drawScale(gd,this.ox,this.oy,this.endx,this.oy,this.x.data);
    }
    if(this.x.scale){
        this.drawScale(gd,this.ox,this.oy,this.ox,this.endy,this.y.data);
    }



    //坐标刻度线
    if(this.y.line){
        this.drawScaleLine(gd,this.ox,this.oy,this.endx,this.endy,"#f3f3f5",this.y.data,"vertical");
    }
    if(this.x.line){
        this.drawScaleLine(gd,this.ox,this.oy,this.endx,this.endy,"#f3f3f5",this.x.data,"horizontal");
    }

}

//画横竖坐标轴
createMap.prototype.drawLine = function(gd,x0,y0,x1,y1,color){
    gd.save();
    gd.translate(0.5,0.5);
    gd.lineWidth = 2;
    gd.strokeStyle = color;
    gd.beginPath();
    gd.moveTo(x0,y0);
    gd.lineTo(x1,y1);
    gd.stroke();
    gd.closePath();
    gd.restore();
};

//画坐标轴的两个端点
createMap.prototype.drawExplain = function(gd,x0,y0,text){


    gd.save()
    gd.beginPath();

    gd.fillStyle='#3c3c3c';
    gd.font='26px a';
    gd.textAlign='right';
    gd.textBaseline='top';
    gd.translate(0.5,0.5);
    gd.fillText(text,x0,y0);

    gd.stroke();
    gd.restore();

};


//画刻度
createMap.prototype.drawScale = function(gd,x0,y0,x1,y1,data){

    var direction = x0 == x1 ? "vertical" : "horizontal" //方向
    var l = data.length;
    var s = (y1-y0)/l || (x1-x0)/l;

    gd.save()
    gd.beginPath();
    gd.fillStyle='#3c3c3c';
    gd.font='26px a';
    gd.textAlign='right';
    gd.textBaseline='top';
    gd.translate(0.5,0.5);


    for(var i=0;i<l;i++){
        if(direction == "vertical"){
            gd.fillText(data[i],x0-10,y0+s*i-20);
        }else{
            gd.fillText(data[i],x0+s*i+20,y0+10);
        }

    }

    gd.stroke();
    gd.restore();

};

//画刻度线
createMap.prototype.drawScaleLine = function(gd,x0,y0,x1,y1,color,data,d){
    var direction = d; //方向
    var l = data.length;


    gd.save();
    gd.lineWidth = 2;
    gd.strokeStyle = color;
    gd.translate(0.5,0.5);

    for(var i=0;i<l;i++){
        gd.beginPath();
        if(direction == "vertical"){
            var s = (x1-x0)/l;
            var sx = x0+(i*s);
            gd.moveTo(sx,y0);
            gd.lineTo(sx,y1);

        }else{
            var s = (y1-y0)/l;
            var sy = y0+(i*s);
            gd.moveTo(x0,sy);
            gd.lineTo(x1,sy);
        }
        gd.stroke();
        gd.closePath();

    }

    gd.restore();
};
//设置该画布的tip样式
createMap.prototype.setTip = function(setting){
    this.tip = setting;
}

//将画布清除
createMap.prototype.clearMap = function(gd){
    gd.clearRect(0,0,gd.canvas.width,gd.canvas.height);
};

//将画布生成base64
createMap.prototype.getImageBackground = function(gd){
    var i = new Image();
    i.src = gd.canvas.toDataURL("image/png");
    return i;
};
//将画布预制的base64作为背景贴到canvas上
createMap.prototype.setImageBackground = function(gd,image){

    gd.drawImage(image, 0, 0);

};


/**
 * Created by wuyang on 16/5/8.
 */

//canvas  圆角矩形的画法
CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    this.beginPath();
    this.moveTo(x+r, y);
    this.arcTo(x+w, y, x+w, y+h, r);
    this.arcTo(x+w, y+h, x, y+h, r);
    this.arcTo(x, y+h, x, y, r);
    this.arcTo(x, y, x+w, y, r);
    this.closePath();
    return this;
}

/*
 创建画布
 */
function createTable(w,h){
    this.w = w;
    this.h = h;
    this.c = null;
    this.f = this.f || this.create();

};
createTable.prototype.create = function(){
    var f = document.createDocumentFragment();
    this.c = document.createElement("canvas");

    this.c.width = this.w;
    this.c.height = this.h;

    this.c.style.width = "100%";
    this.c.style.height = "100%";

    f.appendChild(this.c);
    return f;
};
createTable.prototype.getTable = function(){
    return this.f;
};
createTable.prototype.getCanvas = function(){
    return this.c;
};
/**
 * Created by wuyang on 16/5/8.
 */

//鼠标移入数据上时要做的操作
function hoverDataMap(gd,obj,ox,oy,w,h,MULTIPLE){
    this.gd = gd;
    this.ox = ox;
    this.oy = oy;
    this.w = w;
    this.h = h;
    this._map = obj;  //画布对象指向重置
    this.MULTIPLE = MULTIPLE;
}

hoverDataMap.prototype.init = function(){


    //作为测试,先画一个
    this.oImagebase = this._map.getImageBackground(this.gd);
    this.mousemove(this.gd);
}

//绘制tip元素
hoverDataMap.prototype.drawTip = function(gd,x,y,Data){
    var rect_w = 300;
    var rect_h = 150;

    var x = x;
    var y = y;


    var style = Data.style;
    var title = Data.title;
    var data = Data.data;

    var tipbg,tippointbg;

    switch  (style){
        case "table-tip-style1":
            tipbg = "#beecfd";
            tippointbg = "#7fd9fb";
            break;
        case "table-tip-style2":
            tipbg = "#fdf0da";
            tippointbg = "#f13b3b";
            break;
    };

    if(x>(this.ox+this.w-rect_w)){  //鼠标移入到右边缘
        x = x - 400;

        gd.save();
        gd.beginPath();
        gd.fillStyle = '#EB852A';
        gd.shadowOffsetX = 5; // 阴影Y轴偏移
        gd.shadowOffsetY = 5; // 阴影X轴偏移
        gd.shadowBlur = 14; // 模糊尺寸
        gd.shadowColor = 'rgba(0, 0, 0, 0.2)'; // 颜色
        gd.fillStyle=tipbg;

        gd.roundRect(x,y,rect_w,rect_h,20).fill();

        gd.moveTo(x+rect_w,y+40);
        gd.lineTo(x+rect_w+20,y+40+40);
        gd.lineTo(x+rect_w,y+40+80);
        gd.fill();

        gd.beginPath();
        gd.fillStyle=tippointbg;
        gd.strokeStyle="#fff";
        gd.lineWidth = 3;
        gd.arc(x+rect_w,y+77,8,0,2*Math.PI);
        gd.fill();
        gd.stroke();
    }else{
        x = x;

        gd.save();
        gd.beginPath();
        gd.fillStyle = '#EB852A';
        gd.shadowOffsetX = 5; // 阴影Y轴偏移
        gd.shadowOffsetY = 5; // 阴影X轴偏移
        gd.shadowBlur = 14; // 模糊尺寸
        gd.shadowColor = 'rgba(0, 0, 0, 0.2)'; // 颜色
        gd.fillStyle=tipbg;

        gd.roundRect(x,y,rect_w,rect_h,20).fill();

        gd.moveTo(x,y+40);
        gd.lineTo(x-20,y+40+40);
        gd.lineTo(x,y+40+80);
        gd.fill();

        gd.beginPath();
        gd.fillStyle=tippointbg;
        gd.strokeStyle="#fff";
        gd.lineWidth = 3;
        gd.arc(x,y+77,8,0,2*Math.PI);
        gd.fill();
        gd.stroke();
    }






    gd.beginPath();
    gd.fillStyle='#3c3c3c';
    gd.font='26px a';
    gd.textAlign='left';
    gd.textBaseline='top';
    gd.translate(0.5,0.5);


    if(data.length == 1){
        gd.fillText(title,x+20,y+30);
        gd.fillText(data[0],x+20,y+80);
        gd.stroke();
    }else{
        gd.fillText(title,x+20,y+20);
        gd.fillText(data[0],x+20,y+60);
        gd.stroke();
        gd.fillStyle='#f13b3b';
        gd.fillText(data[1],x+20,y+100);
        gd.stroke();
    }

    gd.restore();

};
//将选中的点加粗
hoverDataMap.prototype.hoverPoint = function(gd,x,y,color){
    gd.save();
    gd.beginPath();
    gd.fillStyle=color;
    //gd.moveTo(x,y);
    //gd.lineTo(x+1,y+1);
    gd.arc(x,y,5,0,2*Math.PI);
    gd.fill();
    gd.restore();
};


//根据鼠标位置绘制各种数据
hoverDataMap.prototype.drawDataPoint = function(gd,tx,ty,oImagebase){
    var _m = this._map;
    _m.clearMap(gd);
    _m.setImageBackground(gd,oImagebase);
    //暂时将datamap下的第一个数据作为默认数据
    //处理鼠标移入到canvan上吧鼠标移入的距离乘以像素缩小的倍数
    var dIndex = tx;


    //配置tip显示数据的
    var oTableTipData = {
        style : _m.tip.style,
        title : _m.tip.title
    };

    var _m_tip_data = _m.tip.data;

    //DataMap从目前来看,循环形式展示

    var _oTableTipData_data = [];
    for(var i=0,j=_m_tip_data.length;i<j;i++){

        var dd = gd.DataMap[i];
        var dd_d = {};

        //如果鼠标没有到下一个节点,那么就用上一个节点的数值
        while(dIndex>0 && !(dd_d = dd.d[dIndex])){
            dIndex--;
        }
        var str = "";
        if(dd_d.v){
            str = _m_tip_data[i]+dd_d.v+_m.tip.unit;
        }else{
            str = _m_tip_data[i]+"无";
        }
        _oTableTipData_data.push(str);

        this.hoverPoint(gd,dd_d.x,dd_d.y,dd.color);
    }



    oTableTipData.data = _oTableTipData_data;

    if(_m.tip.show){
        this.drawTip(gd,tx+50,ty-60,oTableTipData);
    }


}

//鼠标划入表格的hover事件
hoverDataMap.prototype.mousemove = function(gd){
    var _this = this;
    var __this = this._map;
    var oImagebase = this.oImagebase;
    var timer = null;
    gd.canvas.onmousemove = function(e){
        //根据假数据生成tip提示框

        var l = (this.parentNode.getBoundingClientRect().left || this.parentNode.offsetLeft)+document.body.scrollLeft;
        var t = (this.parentNode.getBoundingClientRect().top || this.parentNode.offsetTop)+document.body.scrollTop;

        var tx = (e.pageX-l)*_this.MULTIPLE;
        var ty = (e.pageY-t)*_this.MULTIPLE;
        if(ty>(_this.oy+_this.h) || ty<(_this.oy) || tx<_this.ox || tx> (_this.ox+_this.w)){
            //如果鼠标在那个表格之外,那么返回false隐藏tip
            if(oImagebase){
                __this.clearMap(gd);
                __this.setImageBackground(gd,oImagebase);
            }

            return false;
        }else{

            oImagebase && _this.drawDataPoint(gd,tx,ty,oImagebase);
        }

    };
    gd.canvas.onmouseover = function(){

    };
    gd.canvas.onmouseout = function(){
        if(oImagebase){
            __this.clearMap(gd);
            __this.setImageBackground(gd,oImagebase);
        }
    }

}
/**
 * Created by wuyang on 16/5/10.
 */
//提供canvas的接口api

//云char接口

function yunChar(obj,setting){

    var MULTIPLE = setting.multiple || 2;

    var dataset = setting.dataset;
    var axes = setting.axes;

    var oC = new createTable(obj.offsetWidth*MULTIPLE,obj.offsetHeight*MULTIPLE);

    this.oCDM; //存放data线条

    var oFragmentCanvas = oC.getTable();
    obj.appendChild(oFragmentCanvas);

    var oCanvas = oC.getCanvas().getContext("2d");

    //获取canvas对象
    //创建坐标轴

    var oCM = new createMap(axes,oCanvas,MULTIPLE);
    
    oCM.setTip(setting.tip);


    this.oCDM = new createDataMap(oCanvas,oCM,axes.ox*MULTIPLE,(axes.oy-axes.y.len)*MULTIPLE,axes.x.len*MULTIPLE,axes.y.len*MULTIPLE,MULTIPLE);



    for(var i=0,datal = dataset.length;i<datal;i++){
        this.oCDM.drawDataMap(dataset[i].backgroundColor,dataset[i].data);
    }
    this.oCDM.starDraw(setting.animation);//配置好数据,开始画


};

yunChar.prototype.getDataImage = function(){
    return this.oCDM.getDataImage();
}
/**
 * Created by wuyang on 16/5/8.
 */
/*
 * Tween.js
 * t: current time（当前时间）；
 * b: beginning value（初始值）；
 * c: change in value（变化量）；
 * d: duration（持续时间）。
 * you can visit 'http://easings.net/zh-cn' to get effect
 */
var Tween = {
    Linear: function(t, b, c, d) { return c*t/d + b; },
    Quad: {
        easeIn: function(t, b, c, d) {
            return c * (t /= d) * t + b;
        },
        easeOut: function(t, b, c, d) {
            return -c *(t /= d)*(t-2) + b;
        },
        easeInOut: function(t, b, c, d) {
            if ((t /= d / 2) < 1) return c / 2 * t * t + b;
            return -c / 2 * ((--t) * (t-2) - 1) + b;
        }
    },
    Cubic: {
        easeIn: function(t, b, c, d) {
            return c * (t /= d) * t * t + b;
        },
        easeOut: function(t, b, c, d) {
            return c * ((t = t/d - 1) * t * t + 1) + b;
        },
        easeInOut: function(t, b, c, d) {
            if ((t /= d / 2) < 1) return c / 2 * t * t*t + b;
            return c / 2*((t -= 2) * t * t + 2) + b;
        }
    },
    Quart: {
        easeIn: function(t, b, c, d) {
            return c * (t /= d) * t * t*t + b;
        },
        easeOut: function(t, b, c, d) {
            return -c * ((t = t/d - 1) * t * t*t - 1) + b;
        },
        easeInOut: function(t, b, c, d) {
            if ((t /= d / 2) < 1) return c / 2 * t * t * t * t + b;
            return -c / 2 * ((t -= 2) * t * t*t - 2) + b;
        }
    },
    Quint: {
        easeIn: function(t, b, c, d) {
            return c * (t /= d) * t * t * t * t + b;
        },
        easeOut: function(t, b, c, d) {
            return c * ((t = t/d - 1) * t * t * t * t + 1) + b;
        },
        easeInOut: function(t, b, c, d) {
            if ((t /= d / 2) < 1) return c / 2 * t * t * t * t * t + b;
            return c / 2*((t -= 2) * t * t * t * t + 2) + b;
        }
    },
    Sine: {
        easeIn: function(t, b, c, d) {
            return -c * Math.cos(t/d * (Math.PI/2)) + c + b;
        },
        easeOut: function(t, b, c, d) {
            return c * Math.sin(t/d * (Math.PI/2)) + b;
        },
        easeInOut: function(t, b, c, d) {
            return -c / 2 * (Math.cos(Math.PI * t/d) - 1) + b;
        }
    },
    Expo: {
        easeIn: function(t, b, c, d) {
            return (t==0) ? b : c * Math.pow(2, 10 * (t/d - 1)) + b;
        },
        easeOut: function(t, b, c, d) {
            return (t==d) ? b + c : c * (-Math.pow(2, -10 * t/d) + 1) + b;
        },
        easeInOut: function(t, b, c, d) {
            if (t==0) return b;
            if (t==d) return b+c;
            if ((t /= d / 2) < 1) return c / 2 * Math.pow(2, 10 * (t - 1)) + b;
            return c / 2 * (-Math.pow(2, -10 * --t) + 2) + b;
        }
    },
    Circ: {
        easeIn: function(t, b, c, d) {
            return -c * (Math.sqrt(1 - (t /= d) * t) - 1) + b;
        },
        easeOut: function(t, b, c, d) {
            return c * Math.sqrt(1 - (t = t/d - 1) * t) + b;
        },
        easeInOut: function(t, b, c, d) {
            if ((t /= d / 2) < 1) return -c / 2 * (Math.sqrt(1 - t * t) - 1) + b;
            return c / 2 * (Math.sqrt(1 - (t -= 2) * t) + 1) + b;
        }
    },
    Elastic: {
        easeIn: function(t, b, c, d, a, p) {
            var s;
            if (t==0) return b;
            if ((t /= d) == 1) return b + c;
            if (typeof p == "undefined") p = d * .3;
            if (!a || a < Math.abs(c)) {
                s = p / 4;
                a = c;
            } else {
                s = p / (2 * Math.PI) * Math.asin(c / a);
            }
            return -(a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
        },
        easeOut: function(t, b, c, d, a, p) {
            var s;
            if (t==0) return b;
            if ((t /= d) == 1) return b + c;
            if (typeof p == "undefined") p = d * .3;
            if (!a || a < Math.abs(c)) {
                a = c;
                s = p / 4;
            } else {
                s = p/(2*Math.PI) * Math.asin(c/a);
            }
            return (a * Math.pow(2, -10 * t) * Math.sin((t * d - s) * (2 * Math.PI) / p) + c + b);
        },
        easeInOut: function(t, b, c, d, a, p) {
            var s;
            if (t==0) return b;
            if ((t /= d / 2) == 2) return b+c;
            if (typeof p == "undefined") p = d * (.3 * 1.5);
            if (!a || a < Math.abs(c)) {
                a = c;
                s = p / 4;
            } else {
                s = p / (2  *Math.PI) * Math.asin(c / a);
            }
            if (t < 1) return -.5 * (a * Math.pow(2, 10* (t -=1 )) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
            return a * Math.pow(2, -10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p ) * .5 + c + b;
        }
    },
    Back: {
        easeIn: function(t, b, c, d, s) {
            if (typeof s == "undefined") s = 1.70158;
            return c * (t /= d) * t * ((s + 1) * t - s) + b;
        },
        easeOut: function(t, b, c, d, s) {
            if (typeof s == "undefined") s = 1.70158;
            return c * ((t = t/d - 1) * t * ((s + 1) * t + s) + 1) + b;
        },
        easeInOut: function(t, b, c, d, s) {
            if (typeof s == "undefined") s = 1.70158;
            if ((t /= d / 2) < 1) return c / 2 * (t * t * (((s *= (1.525)) + 1) * t - s)) + b;
            return c / 2*((t -= 2) * t * (((s *= (1.525)) + 1) * t + s) + 2) + b;
        }
    },
    Bounce: {
        easeIn: function(t, b, c, d) {
            return c - Tween.Bounce.easeOut(d-t, 0, c, d) + b;
        },
        easeOut: function(t, b, c, d) {
            if ((t /= d) < (1 / 2.75)) {
                return c * (7.5625 * t * t) + b;
            } else if (t < (2 / 2.75)) {
                return c * (7.5625 * (t -= (1.5 / 2.75)) * t + .75) + b;
            } else if (t < (2.5 / 2.75)) {
                return c * (7.5625 * (t -= (2.25 / 2.75)) * t + .9375) + b;
            } else {
                return c * (7.5625 * (t -= (2.625 / 2.75)) * t + .984375) + b;
            }
        },
        easeInOut: function(t, b, c, d) {
            if (t < d / 2) {
                return Tween.Bounce.easeIn(t * 2, 0, c, d) * .5 + b;
            } else {
                return Tween.Bounce.easeOut(t * 2 - d, 0, c, d) * .5 + c * .5 + b;
            }
        }
    }
}
Math.tween = Tween;