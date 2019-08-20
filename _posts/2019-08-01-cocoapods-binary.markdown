---

layout: post
title:  "iOS 组件二进制"
date:   2019-8-1 11:44:32 +0800
categories: iOS
catalog:  true
tags:
  - iOS  
  - 组件化
---



iOS组件化系列

1.  [《使用Cocoapods创建私有podspec》]({{ site.url }}/ios/2018/06/23/private-podspec/) 

2.  [《使用Cocoapods 踩过的坑》]({{ site.url }}/ios/2018/07/04/private-podspec-FAQ/) 

3. [《定时取源码执行pod lib lint校验》]({{ site.url }}/ios/2018/07/13/FDPodBot/) 
4.  [《cocoapods依赖关系导出》]({{ site.url }}/ios/2018/12/27/cocoapods-graph/) 

5.  [《iOS 组件二进制》]({{ site.url }}/ios/2019/08/01/cocoapods-binary//) 



# 由来

目前的现状是安卓在快照包的帮助下，两分钟出个包，iOS在垃圾桶上得十多分钟吧，我本地半个小时也是有可能的。严重影响了打包效率和开发效率。 这也算是组件化的副作用之一，之前看过一篇美团技术博客[美团外卖iOS多端复用的推动、支撑与思考](https://tech.meituan.com/2018/06/29/ios-multiterminal-reuse.html),提到了代码二进制化，可以节省打包时间。 我一般做一件事的思路是先整理一下自己的需求，然后谷歌一下有没有现成的轮子。

## 需求

1. 源码和二进制文件之间可以来回切换，速度比较快 
2. 不影响未接入二进制化方案的业务团队 
3. 组件级别的源码 / 二进制依赖切换功能 
4. 不增加过多额外的工作量 
5. 能提升第一次编译的速度 
6. 无二进制版本时，最好能自动采用源码版本 



# 现有轮子

## 轮子cocoapods-bin（火掌柜）

该插件进行二进制化的策略是采用双私有源，即2个源地址，一个静态服务器保存预先打好包的.a或者framework，一个是我们现在保存源码的服务地址，在install的时候去选择使用下载那个。 

### 优点

- 源码和二进制文件之间可以来回切换，速度比较快 
- 不影响未接入二进制化方案的业务团队 
- 组件级别的源码 / 二进制依赖切换功能 
- 无二进制版本时，自动采用源码版本 
- 接近原生 CocoaPods 的使用体验 （为了满足此需求，我们决定开发自定义的 CocoaPods 插件。） 
- 不增加过多额外的工作量 
- 能提升第一次编译的速度 
- 修复了[cocoapods-packager](https://link.juejin.im/?target=https%3A%2F%2Fgithub.com%2FCocoaPods%2Fcocoapods-packager)的一些未修复的bug 
- 提供了一整套方案，包括后台的文件服务器 

### 缺点

- 与cocoapods工具紧耦合，随着cocoapods 版本的升级，需要随时跟进维护。 



## 轮子[cocoapods-packager](https://link.juejin.im/?target=https%3A%2F%2Fgithub.com%2FCocoaPods%2Fcocoapods-packager)(cocoapods的开源项目)

该插件是cocoapods的一个插件，主要是来将私有库打包成二级制的一个插件，通过pod package KFData.podspec命令

### 优点

- 可以将私有库打包成二级制文件，使用体验好，与cocoapods 一脉相承， 
- 提供的这些参数选项，基本上都到我心坎里了，比如—configuration，--spec-sources，--subspecs，--library 等 
- 现在是北京时间2019.7.31.我的pod版本号是1.7.0。 我看二十多天前刚刚更新，正好能用。很多人吐槽用不了。 

### 缺点

- 该库已经有很长一段时间不维护了，很多问题都未解决，？反正现在我能用
- Swift不能很好的支持？我们项目里面没有swift。所以不知道。 

## [轮子cocoapods-binary](https://link.juejin.im/?target=https%3A%2F%2Fgithub.com%2Fleavez%2Fcocoapods-binary)(是cocoapods推荐的的开源项目)

该插件是开源的Cocoapods推荐的的一个插件，主要是来将Podfile里所依赖的组件选择性打包成二级制的一个插件，通过修改Podfile文件里的内容 

### 优点

- 选择性的在将那些组件使用二进制，不需要多个服务去存二级制文件，二进制文件在pod install的过程进行预编译，生成的项目之间依赖framework。源码变动能比较快的得到相应 
- 整体的设计很好，现有的配置都不需要变动，私有源设置不用变，各个组件内部也不用变。 

### 缺点

- 我没有试成功，当前pod 版本号1.7.0。 
- 我觉得这样的二进制化意义不太大，每次pod install 肯定是一个很慢的过程。可以类比成第一次编译。 
- 二进制切换到源码文件的时候都会删除已经打好的二级制文件，下次切换需要重新编译新的二级制文件，这个过程比较耗时。 



## 轮子4 

[iOS CocoaPods组件平滑二进制化解决方案](https://www.jianshu.com/p/5338bc626eaf)

执行  IS_SOURCE=1 pod install 带入参数，然后在每个组件的podspec 里面做判断

~~~ruby

Pod::Spec.new do |s|
  s.name             = 'BPRCycleScrollView'
  s.version          = '0.1.28'
  s.summary          = '无限轮播图'
  s.description      =  '无限轮播图'
  s.homepage         = 'http://gitlab.bitautotech.com/WP/Mobile/IOS/BPRCycleScrollView'
  s.license          = { :type => 'MIT', :file => 'LICENSE' }
  s.author           = { 'xuxiaolong3' => 'xuxiaolong3@yiche.com' }
  s.source           = { :git => 'http://gitlab.bitautotech.com/WP/Mobile/IOS/BPRCycleScrollView.git', :tag => s.version.to_s }

  s.ios.deployment_target = '8.0'

  #控制安装 Pod 的时候判断使用源码还是二进制库
  $lib = ENV['use_lib']
  $lib_name = ENV["#{s.name}_use_lib"]

  if $lib || $lib_name
    puts '-------------------------------------------------------------------'
    puts 'Notice:BPRCycleScrollView is binary now'
    puts '-------------------------------------------------------------------'
    s.source_files='BPRCycleScrollView-0.1.28/ios/BPRCycleScrollView.framework/Versions/A/Headers/*.h'
    s.public_header_files='BPRCycleScrollView-0.1.28/ios/BPRCycleScrollView.framework/Versions/A/Headers/*.h'
    s.vendored_framework='BPRCycleScrollView-0.1.28/ios/BPRCycleScrollView.framework'
    s.xcconfig = { 'HEADER_SEARCH_PATHS' => '${PODS_ROOT}/BPRCycleScrollView/BPRCycleScrollView-0.1.28/ios/BPRCycleScrollView.framework/Versions/A/Headers/'}
    s.source = { :http => 'http://172.20.15.54/ios_binary/BPRCycleScrollView/BPRCycleScrollView-0.1.28.zip' }
  else
    puts '-------------------------------------------------------------------'
    puts 'Notice:BPRCycleScrollView is source now'
    puts '-------------------------------------------------------------------'
    s.source_files = 'BPRCycleScrollView/Classes/**/*'
  end

   s.dependency 'SDWebImage'

end

~~~

做一个替换，这一步应该可以省略，我暂时没找到原因

~~~objective-c
#import <BPRCycleScrollView/BPRCycleScrollView.h>
替换成
#import "BPRCycleScrollView.h"
~~~

执行pod 命令前面带一个环境变量

~~~shell
#只有BPRCycleScrollView一个库用二进制包
BPRCycleScrollView_use_lib=1 pod update BPRCycleScrollView
#use_lib=1 所有库都用二进制包
BPRCycleScrollView_use_lib=1 pod install

#当然我都是配合如下命令使用
pod cache clean BPRCycleScrollView
rm -rf Pods/BPRCycleScrollView
~~~



### 优点

* 只需要提供一个source 源，如果这也能算优点的话 

* 平滑过渡，改一个支持一个就好，不改的默认支持源码 

### 缺点

* 需要修改每一个pod 的podspec 文件，并且重新推。尤其是一些第三方库，我觉得这样侵入性太强。不够优雅。 

* pod lib lint执行这个命令还需要带上额外的参数， IS_SOURCE=1 pod lib lint

* 最重要的一点，与cocoapods的机制略微有点冲突，切换的时候需要执行清缓存操作



我倾向于用第一个轮子



# 二进制化的难点

1. 现有项目一共有将近89个库，如何批量操作，生成二进制包 
2. 如何兼容不同的config.name,我们的项目中主要是分3个， Debug，Release和Archive。对应不同的环境，不同的编译参数。 
3. 宏定义的处理，尤其是跨模块使用宏定义，在我们的项目中使用了很多跨模块宏定义，如果底层库定义的的模块改了，上层应用方是无感知的。
4. 原本写在podfile 里面的有些编译参数，带不到各自的bundle 里面了
5. 如何不增加过多额外的工作
6. 如何无二进制版本时，最好能自动采用源码版本



解决方案

## 问题1

打算写一个脚本，循环遍历，操作

## 问题2

这个是编译阶段，打算新增三个源，分别是binary_Debug,binary_Release,binary_Archive。

## 问题3

[9 Ways You Can Avoid ObjC Xcode Preprocessor Macros]([**https://qualitycoding.org/xcode-preprocessor-macros/**](https://qualitycoding.org/xcode-preprocessor-macros/))

除了条件编译，其它的宏都可以被替换掉，详情参见博文。这里面还附赠一个脚本，亲测有效，很好使。

~~~shell
find . \( \( -name "*.[chm]" -o -name "*.mm" \) -o -name "*.cpp" \) -print0 | xargs -0 egrep -n '^\w*\#' | egrep -v '(import|pragma|else|endif)'
~~~

看了这篇文章，就知道有很多宏是没有必要的，可以用别的方式替代的

对于问题3没有太好的办法回避，参照上问都给改了吧。

## 问题4

我们在壳工程的Podfile文件里， 会带一些编译参数 

~~~ruby
post_install do |installer|
    installer.pods_project.targets.each do |target|
        target.build_configurations.each do |config|
            if config.name == 'Debug'
                config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] = '$(inherited) DEBUG_ENV=1'
                elsif config.name == 'Release'
                config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] = '$(inherited) RELEASE_ENV=1'
                elsif config.name == 'Archive'
                config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] = '$(inherited) PRODUCTION_ENV=1'
                elsif config.name == 'ReleaseForOperationManager'
                config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] = '$(inherited) RELEASE_FOR_OPERATION=1'
            end
        end
    end
end
~~~

[Every time you use the preprocessor, what you see isn’t what you compile.](https://twitter.com/share?text=Every+time+you+use+the+preprocessor%2C+what+you+see+isn't+what+you+compile.&via=qcoding&related=qcoding&url=https://qualitycoding.org/xcode-preprocessor-macros/)

有木有觉得这句话很精辟。 

对于这个参数，当然最好是给替换掉。目前有三种方案，前两种肯定是可以的。 

当然最好是推荐一个库，用[Bootstrap](https://github.com/krzysztofzablocki/Bootstrap)用这里的方案，替换掉。 

我认为这个是一个优雅的解决方案，条件编译干不了。如果一定需要条件编译，怎么办，那么，往下看。 
### 方案1
参看我之前写的文章的写法，把podfile 的逻辑移到 podspec 里面

这是普通青年的用法

~~~objective-c
[JSPatch startWithAppKey:@"YOU_GUESS"];
#ifdef DEBUG
[JSPatch setupDevelopment];
#endif
[JSPatch sync];
~~~

这是文艺青年的用法

~~~ruby
Pod::Spec.new do |s|

  #设置 podspec 的默认 subspec
  s.default_subspec = 'core'
  #主要 subspec
  s.subspec 'core' do |c|
    c.source_files  = "*.{h,m}"
    c.public_header_files = "*.h"
    c.frameworks = 'UIKit',
    c.libraries = 'icucore', 'sqlite3', 'z'
    c.platform = :ios, "7.0"
  end
  #功能1，引入则开启
  s.subspec 'IDFA' do |f|
    f.dependency 'YOUR_SPEC/core'
    f.pod_target_xcconfig = { 'GCC_PREPROCESSOR_DEFINITIONS' => 'ENABLE_IDFA=1'}
  end

  #功能2，引入则开启
  s.subspec 'IDFB' do |f|
    f.dependency 'YOUR_SPEC/core'
    f.pod_target_xcconfig = { 'GCC_PREPROCESSOR_DEFINITIONS' => 'ENABLE_IDFB=1'}
  end  

end
~~~

在上层壳工程

~~~ruby
pod YOUR_SPEC.IDFA ,:configuration => ['Debug’]
pod YOUR_SPEC.IDFB ,:configuration => [‘Release’]
~~~



### 方案2

https://stackoverflow.com/questions/29241458/cocoapods-specify-podspec-xcconfig-value-for-debug-only?noredirect=1

这篇文章，分成两个库

pod 'my-podspec-debug', :configurations => ['Debug']

pod 'my-podspec-release', :configurations => ['Release']

这和我第一个方案类似，只不过颗粒度更大了。 

### 方案3

s.xcconfig = { "GCC_PREPROCESSOR_DEFINITIONS" => "$(GCC_PREPROCESSOR_DEFINITIONS_$(CONFIGURATION))", 

​                "GCC_PREPROCESSOR_DEFINITIONS_Debug" => "MY_DEFINE=1” }

这个没试过，也是上面链接里的，回头我做的时候试一下，

## 问题5

如何不增加过多额外的工作呢？

打算写一个脚本，在pod repo push 之余，做下面这些事情。只不过我的二进制包得上传到3个源。



## 问题6 

如何无二进制版本时，最好能自动采用源码版本?

最后轮子4可以实现，用环境变量区分。cocoapods-bin 也可以做到。

当然其它方案，得在每个pod 后面自行制定地址了，比如    

~~~ruby
pod 'BPCarModelLib', :git => 'http://gi#####.git', :tag => '0.15.59'
~~~



现在还没开始编码，先整理一下，目前的思考和资料，后续实践过程中遇到问题再补充。

# 参考

1. [9 Ways You Can Avoid ObjC Xcode Preprocessor Macros](https://qualitycoding.org/xcode-preprocessor-macros/)

2. [Bootstrap](https://github.com/krzysztofzablocki/Bootstrap)

3. [美团外卖iOS多端复用的推动、支撑与思考](https://tech.meituan.com/2018/06/29/ios-multiterminal-reuse.html)

4. [cocoapods-packager](https://link.juejin.im/?target=https%3A%2F%2Fgithub.com%2FCocoaPods%2Fcocoapods-packager)

5. (https://link.juejin.im/?target=https%3A%2F%2Fgithub.com%2Fleavez%2Fcocoapods-binary)

6. [iOS CocoaPods组件平滑二进制化解决方案](https://www.jianshu.com/p/5338bc626eaf)

7. [stackover flow](https://stackoverflow.com/questions/29241458/cocoapods-specify-podspec-xcconfig-value-for-debug-only?noredirect=1)

8. [cocoapods-bin](https://link.juejin.im/?target=https%3A%2F%2Fgithub.com%2FtripleCC%2Fcocoapods-bin)

9. [三个方案对比](https://juejin.im/post/5cbec5fb5188250aa21919d0)

   
