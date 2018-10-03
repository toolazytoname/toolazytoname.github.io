---
layout: post
title:  "iOS icon加水印"
date:   2018-10-03 22:58:32 +0800
categories: iOS
catalog:  true
tags:
  - iOS 
---



# iOS icon加水印

## 介绍
经常出现测试同事反馈新出的包没有修复已经修改的bug。一顿查，有时候是因为测试没有及时下新包，有的时候是因为开发没有及时git push 代码。想起之前同事提过给icon加水印是一个好办法，再结合把podfile文件内容显示在debug页面，效果也不错。

## 如何实现
搜到了两种方案，[iOS——写一个快速定位问题的脚本](http://zhoulingyu.com/2017/04/04/iOS——写一个快速定位问题的脚本/#more)没有试成，这种方案是进入编译后的工程目录，去替换相应的图标文件。用到了ImageMagick 。
另一种方案时候，直接修改工程目录中的图标源文件，这种方法试成功了。用到了ImageMagick 和ghostscript。不是太理解，ghostscript [Overlaying application version on top of your icon](http://merowing.info/2013/03/overlaying-application-version-on-top-of-your-icon/)提到了，ghostscript (fonts),但我还是不太理解ghostscript 是干啥用的。ImageMagick 我能用which convert 来判断是否安装，ghostscript 就不知道改怎么判断了，灵机一动。

~~~shell
#判断是否已经安装了必须工具 imagemagick ghostscript
echo `brew ls` |grep -q "imagemagick"
if [ $? -eq 0 ]; then
echo "imagemagick installed "

echo `brew ls` |grep -q "ghostscript"
if [ $? -eq 0 ]; then
echo "ghostscript installed "

~~~


## 目标
希望只用ImageMagick 这么一个库，应该也是可以实现的
自己改了一下代码，先用上,调高了高度，修改了文案。

~~~shell
version=`/usr/libexec/PlistBuddy -c "Print CFBundleVersion" "${INFOPLIST_FILE}"`
commit=`git rev-parse --short HEAD`
branch=`git rev-parse --abbrev-ref HEAD`
buildNumber=`/usr/libexec/PlistBuddy -c "Print CFBundleVersion" "${INFOPLIST_FILE}"`
buildDate=`date "+%Y-%m-%d"`
buildTime=`date "+%H:%M:%S"`
caption="${buildDate}\n${buildTime}\n${buildNumber}_${branch}\n${commit}"

function processIcon() {
    #根据传入参数获取文件名
    base_file=$1
    #得到完整路径
    base_path=`find ${SRCROOT} -name $base_file`
    #打印完整路径
    echo "base_path:${base_path}"
    #如果找不到这个文件就退出
    if [[ ! -f ${base_path} || -z ${base_path} ]]; then
    return;
    fi

    # 如果icon-60@2x_base.png 我猜得到的应该是icon-60@2x.png
    target_file=`echo $base_file | sed "s/_base//"`
    target_path="${SRCROOT}/BitAutoPlus/Assets.xcassets/AppIcon.appiconset/${target_file}"
    #如果是Release，恢复AppIcon.appiconset中的水印图为默认图片
#    if [ $CONFIGURATION = "Release" ]; then
#    cp ${base_path} ${target_path}
#    return
#    fi

    #获取原始文件宽度
    width=`identify -format %w ${base_path}`
    #获取原始文件高度
    height=`identify -format %h ${base_path}`
    #设置水印高度
    targetHeight=$(((4 * $height) / 6))
    #生成目标图片，swap 的官方解释看懂了，用到这不知道有什么用
    #-swap index,index
#Swap the positions of two images in the image sequence.

#For example, -swap 0,2 swaps the first and the third images in the current image sequence. Use +swap to switch the last two images in the sequence.
    convert -background '#0008' -fill white -gravity center -size ${width}x${targetHeight}\
    caption:"${caption}"\
    ${base_path} +swap -gravity south -composite ${target_path}
}

convertPath=`which convert`
if [[ ! -f ${convertPath} || -z ${convertPath} ]]; then
echo "==============
WARNING: 你需要先安装 ImageMagick！！！！:
brew install imagemagick
=============="
exit 0;
fi



processIcon "icon-60@2x_base.png"
processIcon "icon-60@3x_base.png"
~~~



## 注意事项

Compress Png Files 这一选项，只有在Xcode工程有图片资源的时候才会显示这个选项，如果把图片资源删除，这一选项会自动消失。

## 参考

1. [在iOS APP icon上添加版本、时间等信息](https://www.jianshu.com/p/df21c51668f1)
2. [给iOS应用的Logo加上构建信息水印](https://juejin.im/post/5a32120f51882575d42f6609)
3. [iOS——写一个快速定位问题的脚本](http://zhoulingyu.com/2017/04/04/iOS——写一个快速定位问题的脚本/#more)
4. [Overlaying application version on top of your icon](http://merowing.info/2013/03/overlaying-application-version-on-top-of-your-icon/)
5. [Command-line Tools:Convert](http://www.imagemagick.org/script/convert.php)


