---
layout: post
title:  "iOS Location Spoofing"
date:   2018-10-03 18:19:32 +0800
categories: iOS
catalog:  true
tags:
  - iOS 
---



# iOS 模拟定位

## 介绍
### 由来
某个加班回来的晚上，根据同事的思路随意搜索了一下，还真有在iOS上现成的解决方案。
### 简单介绍一下
#### 越狱设备
如果你的设备是越狱设备，那么可以试试安一个插件，LocationFaker，或者iOSRoamingGuide。
#### iOS10 及以下(未亲试)
iOS 11 苹果应该是把这个方案给关掉了。如果你的设备恰巧符合要求，
1. 那么用iTunes 做一个备份，记得不要选择加密。
2. 备份完成以后，打开备份文件夹。定位到这个目录AppDomain-com.apple.Maps >> Library >> Preferences ，打开com.apple.Maps.plist，在 </dict> 标签前面插入下面这段内容。


~~~xml
 <key>__internal__PlaceCardLocationSimulation</key>
 <true/>
~~~
3. 还原修改后的备份文件
4. 打开苹果自带的地图应用，搜索你想要定位的点，
5. 找到点以后，往下搓到底，会看到一个按钮 “Simulate Location” ，点击就可以了。
6. 完事以后，如果想还原，那么重启一下设备吧。

#### 主流方案
大多数人的设备的系统版本都升到12了，至少11了吧，而且一般人也不会越狱。所以只能用以下方案了。这个方案最大的缺点是需要连接Xcode  debug，所以你得背着你的电脑才可以。

Xcode 可以在debug的时候，修改当前正在debug 的App的定位信息，顺带就把整个设备的定位信息给改了，我们正式利用了这一点，才可以做到在未越狱的设备上，修改别的App的定位。
用gpx 文件来代替设备GPS接口返回的定位信息，这个gpx文件很强大，可以模拟一个点，也可以模拟一条路径。
具体操作Debug--->Simulate Location --> Location1（自己新建的gpx文件）。
如果你嫌麻烦，懒得每次都这么点，也可以在启动的时候，设置默认位置，具体操作路径是
product -->Scheme --> edit scheme -->options --->default location (插上真机才会有这个选项)

##### 获取GCJ－02经纬度
通过[高德开放平台](https://lbs.amap.com/console/show/picker)获取某一点的经纬度数据。

##### 获取WGS－84经纬度
GCJ－02转换成 WGS－84坐标系
代码[FDLocationCoordinateUtil.h](https://github.com/toolazytoname/FDKit/blob/master/FDKit/Classes/Utility/LocationCoordinate/FDLocationCoordinateUtil.h)

##### 改变相应的经纬度值
~~~xml
<?xml version="1.0"?>
<gpx version="1.1" creator="Xcode">

    <!--
     Provide one or more waypoints containing a latitude/longitude pair. If you provide one
     waypoint, Xcode will simulate that specific location. If you provide multiple waypoints,
     Xcode will simulate a route visiting each waypoint.
     -->
    
    <wpt lat="42.877021" lon="129.413881">
        <name>Cupertino</name>

        <!--
         Optionally provide a time element for each waypoint. Xcode will interpolate movement
         at a rate of speed based on the time elapsed between each waypoint. If you do not provide
         a time element, then Xcode will use a fixed rate of speed.

         Waypoints must be sorted by time in ascending order.
         -->
        <time>2014-09-24T14:55:37Z</time>
    </wpt>

</gpx>

~~~





## 背景知识
以下是坐标系的基础知识，苹果用的是WGS-84，gpx文件的经纬度，可以直接通过设备获取，也可以通过高德地图拿到，然后略加转换层WGS-84就可以了。具体算法，参考文献第二篇就可以了。
###  WGS－84
WGS－84原始坐标系，一般用国际GPS纪录仪记录下来的经纬度，通过GPS定位拿到的原始经纬度，Google和高德地图定位的的经纬度（国外）都是基于WGS－84坐标系的；但是在国内是不允许直接用WGS84坐标系标注的，必须经过加密后才能使用。

### GCJ－02坐标系，又名“火星坐标系” 
GCJ－02坐标系，又名“火星坐标系”，是我国国测局独创的坐标体系，由WGS－84加密而成，在国内，必须至少使用GCJ－02坐标系，或者使用在GCJ－02加密后再进行加密的坐标系，如百度坐标系。高德和Google在国内都是使用GCJ－02坐标系，可以说，GCJ－02是国内最广泛使用的坐标系；
https://lbs.amap.com/console/show/picker 通过这种方式获取坐标

###  百度坐标系:bd-09
百度坐标系:bd-09，百度坐标系是在GCJ－02坐标系的基础上再次加密偏移后形成的坐标系，只适用于百度地图。(目前百度API提供了从其它坐标系转换为百度坐标系的API，但却没有从百度坐标系转为其他坐标系的API)


## 畅想

知道了这个小技巧，朋友圈装一装啥的，已经不在话下了。如果用来打卡，钉钉啥的，应该也没啥问题。如果某些企业会自建一些App，简单把位置定位到某一个点不管用，那么就要自己多开动脑筋想想了，我就碰到了一个这种情况，略施小计，也还是搞定了。说来惭愧，如此自视甚高的一个工程师，竟然沦落到需要用这种方式来打卡，一起砥砺前行吧。

## 参考
1. [How to Fake GPS location on iPhone No Jailbreak](https://7labs.io/mobile/iphone/change-gps-location.html)
2. [无需越狱，随时随地用钉钉，微信打卡](https://www.jianshu.com/p/5e221c5f5a6a)



