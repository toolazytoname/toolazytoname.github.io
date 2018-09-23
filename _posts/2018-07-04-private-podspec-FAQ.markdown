---
layout: post
title:  "使用Cocoapods 踩过的坑"
date:   2018-07-04 22:04:32 +0800
categories: iOS
catalog:  true
tags:
  - iOS
---



# 使用Cocoapods 踩过的坑

Cocoapods 是iOS开发第三方库管理事实上的标准，惭愧的是一直停留在很浅层应用，这两天因为工作需要接触稍多，现在已是头破血流，伤痕累累。为了小伙伴们少走弯路，也为了自己方便以后查看，现简单记录一下踩过的坑。



## pod lib lint 能过 ,  但是 repo push 过不了

pod lib lint 能过 ,  但是repo push 过不了，提示错误

```shell
    - ERROR | [iOS] [BPBaseFuncLib/OCR] file patterns: The `vendored_frameworks` pattern did not match any file.  
    - ERROR | [iOS] [BPBaseFuncLib/OCR] file patterns: The `public_header_files` pattern did not match any file.
    - ERROR | [iOS] [BPBaseFuncLib/OCR] file patterns: The `resource_bundles` pattern for `OCR` did not match any file.
```
依照提示，查看本地文件夹没有问题，百思不得其解。还以为是缓存问题没有更新。原因是git 没有push，repo push 走的是网络验证，pod lib lint 走的是本地验证。因为没有推上去，当然找不到文件。

## 引用不到最新更新的代码

这时候，可以试试 新打一个tag，然后重新推一把。
也可以试试pod update，问题来了，[pod install 和 pod upate 有啥区别？](https://guides.cocoapods.org/using/pod-install-vs-update.html)


##  [Xcodeproj] Generated duplicate UUIDs:

Podfile 加上

~~~ruby
install! 'cocoapods', :deterministic_uuids => false

~~~
即可，这个我还不知道是啥意思

## podspec 依赖私有库

入股podspec如果有依赖私有库，验证的时候记得带上--source，push 的时候也一样，不然找不到。

~~~ruby
pod lib lint --sources='https://github.com/toolazytoname/Specs.git,https://github.com/CocoaPods/Specs.git' --allow-warnings

~~~

## pod lib lint 验证出错

pod lib lint 验证出错的时候，当然 error肯定要看，但是note 也很重要，今天就是note提示了找不到文件。


## vendored_libraries

表示依赖第三方的静态库, 依赖的第三方的或者自己的静态库文件必须以lib为前缀进行命名 ，否则会找不到

~~~ruby
s.vendored_libraries = 'Library/Classes/libWeChatSDK.a'
~~~



## target has transitive dependencies that include static binaries



~~~shell
BPMessageCenterLib git:(master) ✗ pod lib lint --sources='http://gitlab.bitautotech.com/WP/Mobile/IOS/Specs.git,https://github.com/CocoaPods/Specs.git' --allow-warnings

 -> BPMessageCenterLib (0.1.0)
    - ERROR | [iOS] unknown: Encountered an unknown error (The 'Pods-App' target has transitive dependencies that include static binaries: (/private/var/folders/m6/l5q3hp4d24d4vk4xplkcnhmh0000gn/T/CocoaPods-Lint-20180710-38805-dbfvbq-BPMessageCenterLib/Pods/RongCloudIM/RongCloudIM/RongIMKit.framework, /private/var/folders/m6/l5q3hp4d24d4vk4xplkcnhmh0000gn/T/CocoaPods-Lint-20180710-38805-dbfvbq-BPMessageCenterLib/Pods/RongCloudIM/RongCloudIM/libopencore-amrnb.a, and /private/var/folders/m6/l5q3hp4d24d4vk4xplkcnhmh0000gn/T/CocoaPods-Lint-20180710-38805-dbfvbq-BPMessageCenterLib/Pods/RongCloudIM/RongCloudIM/RongIMLib.framework)) during validation.

[!] BPMessageCenterLib did not pass validation, due to 1 error.
You can use the `--no-clean` option to inspect any issue.

[!] 'RongCloudIM' uses the unencrypted http protocol to transfer the Pod. Please be sure you're in a safe network with only trusted hosts in there. Please reach out to the library author to notify them of this security issue.
~~~



很简单，加一个

~~~shell
--use-libraries
~~~

就好了。

## Invalid `Podfile` file: syntax error, unexpected end-of-input, expecting keyword_end.

在Podfile的末尾添加 end



## Pod lint fails when containing dynamic-frameworks without simulator architectures

苹果商店会拒绝包含模拟器架构的dynamic-framework,因此只能用包含真机的包，于是就碰到了如上问题，参看[#5854](https://github.com/CocoaPods/CocoaPods/issues/5854) 解决办法是加一个

~~~shell
--skip-import-validation
~~~





## pod lib lint  和repo push的验证时间太久

随着使用的深入，pod lib lint  和repo push的验证操作时间太久了，目前还没有好办法。

分析慢的原因

### 网络慢

1.  干掉对官方库的依赖，GitLab上搭建一个私有的官方库索引镜像，同时在内网GitLab上把AF啊，SD之类的工程库也建一个镜像（这一步很重要）。目前这个工作由同事手工完成，这个也可以写一个脚本，我看有相应的API。

### 编译验证慢

1. 这个没有深入分析



## 两个第三方库冲突

两个第三方库冲突，项目需要同时引入优酷播放器和友盟，单独引入都没有问题，同时引入会偶发崩溃

日志如下

~~~
2018-08-02 11:41:47.220381+0800 BPBaseFuncLib_Example[39063:17508875] Could not successfully update network info during initialization.
2018-08-02 11:41:47.334518+0800 BPBaseFuncLib_Example[39063:17508774] Could not save pasteboard named com.tencent.mqq.api.registerAppPlugin. Error: Error Domain=PBErrorDomain Code=0 "Cannot load representation of type com.tencent.mqq.api.registerAppPlugin" UserInfo={NSLocalizedDescription=Cannot load representation of type com.tencent.mqq.api.registerAppPlugin, NSUnderlyingError=0x6040002545b0 {Error Domain=PBErrorDomain Code=15 "No loader block available for type com.tencent.mqq.api.registerAppPlugin." UserInfo={NSLocalizedDescription=No loader block available for type com.tencent.mqq.api.registerAppPlugin.}}}
(lldb) 
~~~

参看优酷文档，可以通过在宿主工程里面直接设置。

~~~
Other Linker Flags 设置 -force_load  "$(PROJECT_DIR)/path/to/libYouTuMediaPlayerEngineYouku.a"
~~~

不知道为什么，我在podspec 里面设置不管用。

~~~
spec.pod_target_xcconfig = { 'OTHER_LDFLAGS' => '-lObjC' }

~~~

## Subspecs 的理解

代码如下

~~~Ruby
  s.resource_bundle = { 'BPBaseFuncLib' => 'BPBaseFuncLib/Assets/*' }
  s.subspec 'OCR' do |ss|
    ss.source_files = 'BPBaseFuncLib/Classes/OCR/*','BPBaseFuncLib/Classes/BPBaseFuncBundle/*'
    ss.public_header_files = 'BPBaseFuncLib/Classes/OCR/BPOCRProtocol.h'
    ss.vendored_frameworks =['BPBaseFuncLib/Classes/OCR/lib/AipBase.framework','BPBaseFuncLib/Classes/OCR/lib/IdcardQuality.framework']
  end
~~~

在外部直接 BPBaseFuncLib/OCR，竟然找不到BPBaseFuncLib这个bundle，直接写BPBaseFuncLib当然是会有这个bundle的，着让我很费解，参看官方文档Subspecs 和主spec应该是一个继承的关系，先留着，待后续更新吧。

# 常用命令放着复制粘贴

~~~shell
pod lib lint --sources='http://gitlab.bitautotech.com/WP/Mobile/IOS/Specs.git,https://github.com/CocoaPods/Specs.git' --allow-warnings --use-libraries --fail-fast --skip-import-validation


pod repo push XXSpecs XXXXXXXLib.podspec --sources='http://gitlab.bitautotech.com/WP/Mobile/IOS/Specs.git,https://github.com/CocoaPods/Specs.git' --allow-warnings --use-libraries  --skip-import-validation

~~~






## 参考

* [https://cocoapods.org](https://cocoapods.org)
* [google](https://www.google.com/) 
