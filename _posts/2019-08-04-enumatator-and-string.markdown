---

layout: post
title:  "Objective-c 枚举和字符串互相转换"
date:   2019-8-4 13:34:32 +0800
categories: iOS
catalog:  true
tags:
    - iOS
    - 编程技巧
---





Objective-c 中枚举和字符串转换时候很常见的一个应用场景

# 套路列举

## switch  case

大家都会写，就不占篇幅了

## 数组

~~~objective-c
//枚举定义
typedef NS_ENUM(NSUInteger, BPEPlaceHolderType) {
    BPEPlaceHolderType_None              = 0,//没有占位图，保留老代码中的值，各业务线不用改
    BPEPlaceHolderType_Gray_E_Yiche      = 1,//灰色占位图，保留老代码中的值，各业务线不用改
    BPEPlaceHolderType_Gray_E_Yiche_Big  = 4,
    BPEPlaceHolderType_Gray_E            = 5,
    BPEPlaceHolderType_Black_E_Yiche     = 2, //黑色，保留老代码中的值，各业务线不用改
    BPEPlaceHolderType_Black_E_Yiche_Big = 6,
    BPEPlaceHolderType_Black_E           = 7,
    BPEPlaceHolderType_Avatar            = 3,//头像，保留老代码中的值，各业务线不用改
};

//枚举转字符串
static NSString *BPEPlaceHolderImageNames[] = {
    [BPEPlaceHolderType_Gray_E_Yiche]      = @"BPBaseLib.bundle/bpe_placeholder_gray_e_yiche",
    [BPEPlaceHolderType_Gray_E_Yiche_Big]  = @"BPBaseLib.bundle/bpe_placeholder_gray_e_yiche_big",
    [BPEPlaceHolderType_Gray_E]            = @"BPBaseLib.bundle/bpe_placeholder_gray_e",
    [BPEPlaceHolderType_Black_E_Yiche]     = @"BPBaseLib.bundle/bpe_placeholder_black_e_yiche",
    [BPEPlaceHolderType_Black_E_Yiche_Big] = @"BPBaseLib.bundle/bpe_placeholder_black_e_yiche_big",
    [BPEPlaceHolderType_Black_E]           = @"BPBaseLib.bundle/bpe_placeholder_black_e",
    [BPEPlaceHolderType_Avatar]            = @"BPBaseLib.bundle/bpe_placeholder_avatar"
};

NSUInteger length = sizeof(BPEPlaceHolderImageNames)/sizeof(BPEPlaceHolderImageNames[0]);
    //避免越界，数组范围是0~length-1,所以0也算在数组范围内，只是值为nil而已
    if (type < 0 || type >=length  ) {
        return nil;
    }
    NSString *imageName = BPEPlaceHolderImageNames[type];
~~~

我一般都会这么写，比较喜欢，枚举和字符串的转换这一部分，很直观，不容易出错，也不用刻意加多余的代码。BPEPlaceHolderImageNames 是一个数组，这里有两点不太好。

###  数组表发方式的缺点1
如果我在定义枚举值的时候把BPEPlaceHolderType_Avatar改为300，那么BPEPlaceHolderImageNames 的数组长度就会变为300+1。这样就会浪费内存。
###  数组表发方式的缺点2
永远不要相信外部的传入，如果我没有定义0的枚举值，BPEPlaceHolderImageNames[0]会是一个nil。
但如果传入的枚举值是    if (type < 0 || type >=length  ) ，就会数组就越界了。

## 字典


~~~objective-c

//CREnumHelper.h
@interface CREnumHelper : NSObject
+(XMPPMessageType)coro_getMessageTypeByMessageTypeString:(NSString *)messageTypeStr;
+ (NSString *)coro_getMessageTypeStringByMessageType:(XMPPMessageType)messageType;
@end

  //CREnumHelper.m
static NSDictionary *dict ;
@implementation CREnumHelper
+ (void)load {
	dict = @{
				@(XMPPMessageTypeText): @"文本",
				@(XMPPMessageTypeImage): @"图片",
				@(XMPPMessageTypeVoice): @"语音",
				@(XMPPMessageTypeSystemTip): @"系统消息",
				@(XMPPMessageTypeFace): @"表情",
				@(XMPPMessageTypeVideo): @"视频",
				@(XMPPMessageTypeLocal): @"定位"
			};
}
+ (XMPPMessageType)coro_getMessageTypeByMessageTypeString:(NSString *)messageTypeStr {
	__block XMPPMessageType messageType;
	[dict enumerateKeysAndObjectsUsingBlock:^(id  _Nonnull key, id  _Nonnull obj, BOOL * _Nonnull stop) {
	if ([obj isEqualToString:obj]) {
	messageType = [key integerValue];
	*stop = YES;
	}
	}];
	return messageType;
}
+ (NSString *)coro_getMessageTypeStringByMessageType:(XMPPMessageType)messageType {
	__block NSString *messageTypeStr = nil;
	[dict enumerateKeysAndObjectsUsingBlock:^(id  _Nonnull key, id  _Nonnull obj, BOOL * _Nonnull stop) {
	if ([key integerValue] == messageType) {
	messageTypeStr = obj;
	*stop = YES;
	}
	}];
	return messageTypeStr;
}
@end
  
//  调用的时候
  NSLog(@"文本的枚举值是%lu",(unsigned long)[CREnumHelper coro_getMessageTypeByMessageTypeString:@"文本"]);
NSLog(@"XMPPMessageTypeLocal的相应值是%@",[CREnumHelper coro_getMessageTypeStringByMessageType:XMPPMessageTypeLocal]);
~~~

这样写的好处很直观，可以互相转换了，同时坐拥天然的健壮性。


# swift 

记得swift 在这个场景下可以写的很优雅，查了一下 [官方文档](https://docs.swift.org/swift-book/LanguageGuide/Enumerations.html)


# 参考

1. [Objective-C 枚举转字符串](http://corotata.com/2015/11/17/2015-11-17-OC枚举转字符串的想法/)

