---
layout: post
title:  "iOS icon加水印"
date:   2018-10-03 22:58:32 +0800
categories: iOS
catalog:  true
tags:
  - iOS 
  - 自制工具
  - Shell
 
---



# iOS icon加水印

## 介绍
经常出现测试同事反馈新出的包没有修复已经修改的bug。一顿查，有时候是因为测试没有及时下新包，有的时候是因为开发没有及时git push 代码。想起之前同事提过给icon加水印是一个好办法，再结合把podfile文件内容显示在debug页面，效果也不错。

## 如何实现
搜到了两种方案，[iOS——写一个快速定位问题的脚本](http://zhoulingyu.com/2017/04/04/iOS——写一个快速定位问题的脚本/#more)没有试成，这种方案是进入编译后的工程目录，去替换相应的图标文件。用到了ImageMagick 。
另一种方案时候，直接修改工程目录中的图标源文件，这种方法试成功了。


## 目标
scripts/water_mark.sh

~~~shell
#!/bin/sh

#需要在外面定义最多重传次数 pgy_upload_max_retry_count
if [[ -n $water_mark_shell_imported ]]; then
  return
fi
export water_mark_shell_imported="water_mark.sh"

. log.sh
. base_command.sh

function processIcon() {
  local info_plist_file=$1
  #根据传入参数获取文件名
  local base_file=$2
  local source_root=$3
  local appicon_appiconset_path=$4
  local build_datetime_for_buildnumber=$5

  stream_output "info_plist_file:${info_plist_file}"

  local version=`/usr/libexec/PlistBuddy -c "Print CFBundleShortVersionString" ${info_plist_file}`
  local commit=`git rev-parse --short HEAD`
  local branch=`git rev-parse --abbrev-ref HEAD`
  local buildNumber=`/usr/libexec/PlistBuddy -c "Print CFBundleVersion" ${info_plist_file}`
  # local buildDate=`date "+%Y-%m-%d"`
  # local buildTime=`date "+%H:%M:%S"`

  # local caption="${buildDate}\n${buildTime}\n${version}\n${buildNumber}_${branch}\n${commit}"
  local caption="${build_datetime_for_buildnumber}\n${version}\n${buildNumber}_${branch}\n${commit}"


  #得到完整路径
  local base_path=`find ${source_root} -name $base_file`
  #打印完整路径
  stream_output "base_path:${base_path}"
  #如果找不到这个文件就退出
  if [[ ! -f ${base_path} || -z ${base_path} ]]; then
    return;
  fi

  # 如果icon-60@2x_base.png ,得到的应该是icon-60@2x.png
  local target_file=`echo $base_file | sed "s/_base//"`
  local target_path="${appicon_appiconset_path}/${target_file}"

  #获取原始文件宽度
  local width=`identify -format %w ${base_path}`
    #获取原始文件高度
  local height=`identify -format %h ${base_path}`
  #设置水印高度
  local targetHeight=$(((4 * $height) / 6))

  run_command_not_exit convert -background '#0008' -fill white -gravity center -size ${width}x${targetHeight}\
  caption:"${caption}"\
  ${base_path} +swap -gravity south -composite ${target_path}
}



function water_mark_main() {
  local info_plist_file=$1
  local source_root=$2
  local appicon_appiconset_path=$3
  local build_datetime_for_buildnumber=$4

  #判断是否已经安装了必须工具 imagemagick
  run_command echo `brew ls` |grep -q "imagemagick"
  if (( $? == 0 )); then
    echo "imagemagick installed "
  else
    echo_error "============== WARNING: 你需要先安装 ImageMagick！！！！: brew install imagemagick =============="
  fi

   processIcon ${info_plist_file} "icon-60@2x_base.png" ${source_root} ${appicon_appiconset_path} ${build_datetime_for_buildnumber}
   processIcon ${info_plist_file} "icon-60@3x_base.png" ${source_root} ${appicon_appiconset_path} ${build_datetime_for_buildnumber}
}

~~~



## 注意事项

Compress Png Files 这一选项，只有在Xcode工程有图片资源的时候才会显示这个选项，如果把图片资源删除，这一选项会自动消失。

## 参考

1. [在iOS APP icon上添加版本、时间等信息](https://www.jianshu.com/p/df21c51668f1)
2. [给iOS应用的Logo加上构建信息水印](https://juejin.im/post/5a32120f51882575d42f6609)
3. [iOS——写一个快速定位问题的脚本](http://zhoulingyu.com/2017/04/04/iOS——写一个快速定位问题的脚本/#more)
4. [Overlaying application version on top of your icon](http://merowing.info/2013/03/overlaying-application-version-on-top-of-your-icon/)
5. [Command-line Tools:Convert](http://www.imagemagick.org/script/convert.php)
6. [Bootstrap](https://github.com/krzysztofzablocki/Bootstrap) 这个挺棒的，没来得及细看


