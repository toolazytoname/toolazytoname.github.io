---
layout: post
title:  "使用Cocoapods创建私有podspec"
date:   2018-06-23 22:51:32 +0800
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





# 使用Cocoapods创建私有podspec

学习了一下如何创建私有podspec，相应的案例可以参看 [GitHub上的私有源 ](https://github.com/toolazytoname/Specs)。



## 创建并设置一个私有的Spec Repo

```shell
# pod repo add [Private Repo Name] [GitHub HTTPS clone URL]
$ pod repo add FDSpecs https://github.com/toolazytoname/Specs.git
```

## 创建Pod的所需要的项目工程文件

```shell
$ pod lib create podTestLibrary
#这里需要注意的是每当你向Pod中添加了新的文件或者以后更新了podspec的版本都需要重新执行一遍pod update命令。
```

设置tag

```shell
$ git tag -m "first release" 0.1.0
$ git push --tags     #推送tag到远端仓库
```

编辑完`podspec`文件后，需要验证一下这个文件是否可用，如果有任何`WARNING`或者`ERROR`都是不可以的，它就不能被添加到`Spec Repo`中，不过`xcode`的`WARNING`是可以存在的，验证需要执行一下命令

```shell
$ pod lib lint
$ pod lib lint --sources='https://github.com/toolazytoname/Specs.git,https://github.com/CocoaPods/Specs.git' --allow-warnings

```

<u>这里需要注意一下，如果podspec 有依赖私有源，需要--sources这个参数带上公有源和私有源，后面的push操作也一样</u>

这里列几个自认为很有用的配置

1. --allow-warnings  
2. --use-libraries
3. --skip-import-validation
4. --fail-fast

具体含义自己查一下官方文档吧




## 创建Pod所对应的podspec文件

```she
$ pod spec create PodTestLibrary git@coding.net:wtlucky/podTestLibrary.git
```

本地测试配置好的podspec文件是否可用。

```ruby
platform :ios, '7.0'

pod 'PodTestLibrary', :path => '~/code/Cocoapods/podTest/PodTestLibrary'      # 指定路径
pod 'PodTestLibrary', :podspec => '~/code/Cocoapods/podTest/PodTestLibrary/PodTestLibrary.podspec'  # 指定podspec文件
```



## 向私有的Spec Repo中提交podspec

```shell
$ pod repo push FDSpecs PodTestLibrary.podspec  #前面是本地Repo名字 后面是podspec名字
```

删除一个私有`Spec Repo`

~~~shell
$ pod repo remove FDSpecs
~~~

如果我们要删除私有`Spec Repo`下的某一个`podspec`  只需要`cd`到`~/.cocoapods/repos/FDSpecs`目录下，删掉库目录，然后通过Git将变动 push到远端仓库。



## Specification cheat sheet

### source

The location from where the library should be retrieved.

```ruby
#Specifying a Git source with a tag. This is how most OSS Podspecs work.
spec.source = { :git => 'https://github.com/AFNetworking/AFNetworking.git',
                :tag => spec.version.to_s }

#Using a tag prefixed with 'v' and submodules.
spec.source = { :git => 'https://github.com/typhoon-framework/Typhoon.git',
                :tag => "v#{spec.version}", :submodules => true }

#Using Subversion with a tag.
spec.source = { :svn => 'http://svn.code.sf.net/p/polyclipping/code', :tag => '4.8.8' }

#Using Mercurial with the same revision as the spec's semantic version string.
spec.source = { :hg => 'https://bitbucket.org/dcutting/hyperbek', :revision => "#{s.version}" }
#Using HTTP to download a compressed file of the code. It supports zip, tgz, bz2, txz and tar
spec.source = { :http => 'http://dev.wechatapp.com/download/sdk/WeChat_SDK_iOS_en.zip' }
#Using HTTP to download a file using a hash to verify the download. It supports sha1 and sha256.
spec.source = { :http => 'http://dev.wechatapp.com/download/sdk/WeChat_SDK_iOS_en.zip',
                :sha1 => '7e21857fe11a511f472cfd7cfa2d979bd7ab7d96' }

```

### frameworks

表示依赖系统的框架

~~~ruby
s.frameworks = 'UIKit', 'MapKit'
~~~

### libraries

表示依赖系统类库

~~~ruby
  s.libraries = 'sqlite3','c++.1','bz2.1.0','xml2.2','iconv.2','resolv.9','z.1’
~~~

### vendored_libraries

表示依赖第三方的静态库, <u>依赖的第三方的或者自己的静态库文件必须以lib为前缀进行命名</u>  ，否则会找不到

s.vendored_libraries = 'Library/Classes/libWeChatSDK.a'

~~~ruby
s.vendored_libraries = 'Library/Classes/libWeChatSDK.a'
~~~

### vendored_frameworks

表示依赖第三方的framework

### 公开头文件

可以用这种方式隐藏内部类，保证封装性，让外部引用不到别的类。

~~~ruby
s.public_header_files = 'Pod/Classes/**/*.h'
~~~



### 设置pch

~~~ruby
s.prefix_header_file = 'BPNewsLib/Classes/BPNewsPrivate/BPNBaseHeader.pch'
~~~

一开始用的下面的这种，好low

~~~ ruby
s.prefix_header_contents = '#import "YCAdditions.h"','#import "MJExtension.h"','#import "Masonry.h"','#import "UIImageView+Async.h"','#import <ReactiveObjC/RACEXTScope.h>','#import "YCAppMacro.h"','#import "Constants.h"','#import "BPResponseModel.h"','#import "YCTopicMacros.h"','#import "UITableView+Layout.h"','#import "YCToolSet.h"','#import "M80AttributedLabel.h"'
~~~

## subspec
看到这篇[利用 podspec 的 subspec 来实现多个预处理宏的灵活配置](https://juejin.im/entry/5833b464da2f600061cbf107)，思路很好学习记录如下

这是普通青年的用法

~~~Objective-C
[JSPatch startWithAppKey:@"YOU_GUESS"];
#ifdef DEBUG
[JSPatch setupDevelopment];
#endif
[JSPatch sync];
~~~

这是文艺青年的用法

~~~Ruby
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

这里面通过两个 subpec 来开关功能。当用户用的时候，则在 Podfile 里这么引入

~~~
pod 'YOUR_SPEC', :subspecs => ['IDFA', 'IDFB']
~~~

我觉得这是一种很优雅的做法。



在自己的项目中的应用如下：

随着组件化的铺开，当我们打算创建一个新App的时候，自然而然地就会复用指之前的模块和代码。当一个组件需要同时支持两个上层App， 两个App所需要的逻辑有所差异，我们会把一个库划分为两个子库。例如

```ruby
s.default_subspec = 'Pay'
s.subspec 'Pay' do |pay|
      pay.source_files = 'BitAutoPlusHomeLib/Classes/**/*'
      pay.resource_bundles = {
          'BitAutoPlusHomeLib' => ['BitAutoPlusHomeLib/Assets/**/*.{json,png}']
      }
      pay.dependency 'UMCShare/Social/QQ'
      pay.dependency 'UMCShare/Social/Sina'
      pay.dependency 'UMCShare/Social/WeChat'
  end
  
  s.subspec 'NoPay' do |nopay|
      nopay.source_files = 'BitAutoPlusHomeLib/Classes/**/*'
      nopay.resource_bundles = {
         'BitAutoPlusHomeLib' => ['BitAutoPlusHomeLib/Assets/**/*.{json,png}']
      }
      nopay.dependency 'UMCShareNoPay/Social/QQ'
      nopay.dependency 'UMCShareNoPay/Social/Sina'
      nopay.dependency 'UMCShareNoPay/Social/WeChat'
  end

```

两个子库的区别是pay 这个子库，引入的是一个完整的微信SDK的友盟，而另一个子库引入的是不带微信SDK的友盟。

如果不设置这一个属性，那么根据[官方文档](https://guides.cocoapods.org/syntax/podspec.html#specification) 的解释，外部引用BitAutoPlusHomeLib 的时候，会出现命名重复，冲突的错误。因为 If not specified a specifications requires all its subspecs as dependencies.所以我们需要设置这一个属性为其中一个子库，这个属性在两个子库不能共存的场景下分外实用。



另一个场景的场景是，组件二进制化。当一个库，需要同时对外暴露源码和二进制包的时候。两个子库也会有冲突，这时候也需要设置这个属性。




## Podfile cheat sheet



### pod

```ruby
#you will want to use the latest version of a Pod. If this is the case, simply omit the version requirements.
pod 'SSZipArchive'
#you may want to freeze to a specific version of a Pod, in which case you can specify that version number
pod 'Objection', '0.9'
#Besides no version, or a specific one, it is also possible to use operators:

= 0.1 Version 0.1.
> 0.1 Any version higher than 0.1.
>= 0.1 Version 0.1 and any higher version.
< 0.1 Any version lower than 0.1.
<= 0.1 Version 0.1 and any lower version.
~> 0.1.2 Version 0.1.2 and the versions up to 0.2, not including 0.2. This operator works based on the last component that you specify in your version requirement. The example is equal to >= 0.1.2 combined with < 0.2.0 and will always match the latest known version matching your requirements.
```

###  Build configurations

~~~ruby
pod 'PonyDebugger', :configurations => ['Debug', 'Beta']
pod 'PonyDebugger', :configuration => 'Debug'
~~~

### Source

~~~ruby
pod 'PonyDebugger', :source => 'https://github.com/CocoaPods/Specs.git'
~~~

### Using the files from a local path.

~~~ruby
pod 'AFNetworking', :path => '~/Documents/AFNetworking'
~~~

### From a podspec in the root of a library repository

~~~ruby
#To use the master branch of the repository
pod 'AFNetworking', :git => 'https://github.com/gowalla/AFNetworking.git'
#To use a different branch of the repository
pod 'AFNetworking', :git => 'https://github.com/gowalla/AFNetworking.git', :branch => 'dev'
#To use a tag of the repository
pod 'AFNetworking', :git => 'https://github.com/gowalla/AFNetworking.git', :tag => '0.7.0'
#Or specify a commit:
pod 'AFNetworking', :git => 'https://github.com/gowalla/AFNetworking.git', :commit => '082f8319af'

~~~

### use_frameworks!

Use frameworks instead of static libraries for Pods.

~~~ruby
use_frameworks!
~~~





## 参考

[Podspec Syntax Reference](https://guides.cocoapods.org/syntax/podspec.html#specification)

[Podfile Syntax Reference](https://guides.cocoapods.org/syntax/podfile.html#pod)

[使用Cocoapods创建私有podspec](<http://blog.wtlucky.com/blog/2015/02/26/create-private-podspec/>) 

[使用Cocoapods创建私有库](https://www.jianshu.com/p/d92a987203b1)

[小坑xcrun: error: unable to find utility "simctl", not a developer tool or in PATH](https://segmentfault.com/q/1010000012705430)

[用CocoaPods做iOS程序的依赖管理](http://blog.devtang.com/2014/05/25/use-cocoapod-to-manage-ios-lib-dependency/)

[利用 podspec 的 subspec 来实现多个预处理宏的灵活配置](https://juejin.im/entry/5833b464da2f600061cbf107)

