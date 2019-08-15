---

layout: post
title:  "批量改变图片尺寸"
date:   2019-8-15 15:29:32 +0800
categories: Python
catalog:  true
tags:
  - 自制工具
  - Python
---



# 由来

昨天临时需求换icon，想想之前自己写过一个批量生产icon的脚本。但是不够灵活，无法面对项目中这些命名不会烦，不合理的的场景。于是我对这个脚本升了个级，在支持Python3的同时，支持根据配置文件内容读取配置，输出。妈妈再也不用担心我换icon写错名字了。



# 如何使用

首先得安一个Python3，其次得安一个pillow，Mac 上略微比较麻烦，命令如下

~~~shell
# 直接pip install pillow ，会安到默认的Python2上面， 
➜  AppIconTool git:(master) ✗ python3 -m pip -V
pip 18.1 from /usr/local/lib/python3.7/site-packages/pip (python 3.7)
➜  AppIconTool git:(master) ✗ python3.7 -m pip install pillow
Requirement already satisfied: pillow in /usr/local/lib/python3.7/site-packages (6.1.0)
~~~





## 不设定格式

如果不设定格式，会默认按照脚本内部定义的文件名，尺寸输出图片，路径也会打印在控制台

~~~shell
# python3 /Users/yiche/Code/downloadDemo/FDKit/FDKit/Shell/AppIconTool/ResizeImage.py(脚本路径)  /Users/yiche/Desktop/tempDirectory/icon.png（原始图片路径，最好是1024*1024）

python3 /Users/yiche/Code/downloadDemo/FDKit/FDKit/Shell/AppIconTool/ResizeImage.py  /Users/yiche/Desktop/tempDirectory/icon.png
sys.argv:['/Users/yiche/Code/downloadDemo/FDKit/FDKit/Shell/AppIconTool/ResizeImage.py', '/Users/yiche/Desktop/tempDirectory/icon.png']
output_path is :/Users/yiche/Desktop/tempDirectory/icon_20x20.png
output_path is :/Users/yiche/Desktop/tempDirectory/icon_20x20@2x.png
output_path is :/Users/yiche/Desktop/tempDirectory/icon_20x20@3x.png
output_path is :/Users/yiche/Desktop/tempDirectory/icon_57x57.png
output_path is :/Users/yiche/Desktop/tempDirectory/icon_57x57@2x.png
output_path is :/Users/yiche/Desktop/tempDirectory/icon_57x57@3x.png
output_path is :/Users/yiche/Desktop/tempDirectory/icon_29x29.png
output_path is :/Users/yiche/Desktop/tempDirectory/icon_29x29@2x.png
output_path is :/Users/yiche/Desktop/tempDirectory/icon_29x29@3x.png
output_path is :/Users/yiche/Desktop/tempDirectory/icon_72x72.png
output_path is :/Users/yiche/Desktop/tempDirectory/icon_72x72@2x.png
output_path is :/Users/yiche/Desktop/tempDirectory/icon_72x72@3x.png
output_path is :/Users/yiche/Desktop/tempDirectory/icon_50x50.png
output_path is :/Users/yiche/Desktop/tempDirectory/icon_50x50@2x.png
output_path is :/Users/yiche/Desktop/tempDirectory/icon_50x50@3x.png
output_path is :/Users/yiche/Desktop/tempDirectory/icon_32x32.png
output_path is :/Users/yiche/Desktop/tempDirectory/icon_32x32@2x.png
output_path is :/Users/yiche/Desktop/tempDirectory/icon_32x32@3x.png
output_path is :/Users/yiche/Desktop/tempDirectory/icon_40x40.png
output_path is :/Users/yiche/Desktop/tempDirectory/icon_40x40@2x.png
output_path is :/Users/yiche/Desktop/tempDirectory/icon_40x40@3x.png
output_path is :/Users/yiche/Desktop/tempDirectory/icon_1024x1024.png
output_path is :/Users/yiche/Desktop/tempDirectory/icon_1024x1024@2x.png
output_path is :/Users/yiche/Desktop/tempDirectory/icon_1024x1024@3x.png
output_path is :/Users/yiche/Desktop/tempDirectory/icon_60x60.png
output_path is :/Users/yiche/Desktop/tempDirectory/icon_60x60@2x.png
output_path is :/Users/yiche/Desktop/tempDirectory/icon_60x60@3x.png
output_path is :/Users/yiche/Desktop/tempDirectory/icon_76x76.png
output_path is :/Users/yiche/Desktop/tempDirectory/icon_76x76@2x.png
output_path is :/Users/yiche/Desktop/tempDirectory/icon_76x76@3x.png
~~~



## 设定格式

~~~python
# python3 /Users/yiche/Code/downloadDemo/FDKit/FDKit/Shell/AppIconTool/ResizeImage.py（脚本路径）  /Users/yiche/Desktop/tempDirectory/icon.png（原始图片路径）  ./ImageNameToSizeMap.json（配置文件路径）

➜  AppIconTool git:(master) ✗ python3 /Users/yiche/Code/downloadDemo/FDKit/FDKit/Shell/AppIconTool/ResizeImage.py  /Users/yiche/Desktop/tempDirectory/icon.png  ./ImageNameToSizeMap.json
sys.argv:['/Users/yiche/Code/downloadDemo/FDKit/FDKit/Shell/AppIconTool/ResizeImage.py', '/Users/yiche/Desktop/tempDirectory/icon.png', './ImageNameToSizeMap.json']
output_path is :/Users/yiche/Desktop/tempDirectory/iphone_notification_20@2x.png
output_path is :/Users/yiche/Desktop/tempDirectory/iphone_notification_20@3x.png
output_path is :/Users/yiche/Desktop/tempDirectory/icon_29@2x.png
output_path is :/Users/yiche/Desktop/tempDirectory/icon_29@3x.png
output_path is :/Users/yiche/Desktop/tempDirectory/icon_40@2x.png
output_path is :/Users/yiche/Desktop/tempDirectory/icon_40@3x.png
output_path is :/Users/yiche/Desktop/tempDirectory/icon_60@2x.png
output_path is :/Users/yiche/Desktop/tempDirectory/icon_60@3x.png
output_path is :/Users/yiche/Desktop/tempDirectory/iPad_notification_20.png
output_path is :/Users/yiche/Desktop/tempDirectory/iPad_notification_20@2x.png
output_path is :/Users/yiche/Desktop/tempDirectory/icon_HD_29.png
output_path is :/Users/yiche/Desktop/tempDirectory/icon_HD_58.png
output_path is :/Users/yiche/Desktop/tempDirectory/icon_HD_40.png
output_path is :/Users/yiche/Desktop/tempDirectory/icon_HD_80.png
output_path is :/Users/yiche/Desktop/tempDirectory/icon_HD_76.png
output_path is :/Users/yiche/Desktop/tempDirectory/icon_HD_152.png
output_path is :/Users/yiche/Desktop/tempDirectory/icon_HD_167@2x.png
output_path is :/Users/yiche/Desktop/tempDirectory/icon_1024.png
~~~



## 脚本

[ResizerImage](https://github.com/toolazytoname/ResizerImage)

~~~python
# python3 /Users/yiche/Code/downloadDemo/FDKit/FDKit/Shell/AppIconTool/ResizeImage.py  /Users/yiche/Code/downloadDemo/FDKit/FDKit/Shell/AppIconTool/OrangeDragon.png
# python3 ./ResizeImage.py /Users/yiche/Desktop/tempDirectory/icon.png  ./ImageNameToSizeMap.json

import os
import sys
import PIL.Image
import string
import json

def resize_image_with_config(image_dir, config_dir):
    '''
    读取配置文件的设置，导出对应的图片
    param image_dir:原始图片路径
    param config_dir:配置文件路径
    '''
    original_image = PIL.Image.open(image_dir)
    original_image_folder = os.path.split(image_dir)[0]
    # 读取配置文件
    with open(config_dir, 'r', encoding='utf-8') as f:
        image_config_array = json.load(f)
        for image_config in image_config_array:
            output_image = original_image.resize((image_config['width'], image_config['height']), PIL.Image.ANTIALIAS)
            output_path = os.path.join(original_image_folder,image_config['filename'] )
            output_image.save(output_path)
            print('output_path is :{0}'.format(output_path))

def resize_image_with_default_icon_behaviour(image_dir):
    '''
    默认行为，导出固定格式的icon
    :param image_dir:原始图片路径
    '''
    size_list = ['20', '57', '29', '72', '50', '32', '40', '1024', '60', '76']
    multiple_list = [2, 3]
    original_image = PIL.Image.open(image_dir)
    for output_size in size_list:
        file_name = os.path.splitext(image_dir)[0]
        outFile = file_name + '_' + output_size + 'x' + output_size + '.png'
        output_image = original_image.resize((int(output_size), int(output_size)), PIL.Image.ANTIALIAS)
        output_image.save(outFile)
        print('output_path is :{0}'.format(outFile))

        for multiple in multiple_list:
            outFile_x = file_name + '_' + output_size + 'x' + output_size + '@' + str(multiple) + 'x' + '.png'
            output_image_x = original_image.resize((int(output_size) * multiple, int(output_size) * multiple), PIL.Image.ANTIALIAS)
            output_image_x.save(outFile_x)
            print('output_path is :{0}'.format(outFile_x))


if __name__=='__main__':
    print('sys.argv:{0}'.format(sys.argv))
    if 1 == len(sys.argv) :
        sys.exit('please input a image dir at least')

    if 2 == len(sys.argv):
        image_dirctory = sys.argv[1]
        resize_image_with_default_icon_behaviour(image_dirctory)

    if 3 == len(sys.argv):
        image_dirctory = sys.argv[1]
        config_directory = sys.argv[2]
        resize_image_with_config(image_dirctory,config_directory)

~~~



配置文件

~~~json
[
  {
    "width" : 40,
    "height" : 40,
    "filename" : "iphone_notification_20@2x.png"
  },
  {
    "width" : 60,
    "height" : 60,
    "filename" : "iphone_notification_20@3x.png"
  }
]

~~~

