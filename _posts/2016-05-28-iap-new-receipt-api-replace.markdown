---
layout: post
title:  "IAP回执单新API"
date:   2016-05-28 14:18:32 +0800
categories: iOS
---



项目一直用的是老的API，年前曾经替换成新的API，用如下的写法，但是会有偶发的问题，所以目前生产环境上用的还是老的API。苹果已经不建议使用了。为了尽早替换成新的API，彩琴做了一番研究，找了一下为啥用新的API，会偶发购买失败的原因。代码如下：可以看到做了版本控制。    
![Code Shot]({{ site.url }}/assets/snip20160528_0.png)

#结论
1. 发现其实 transaction.transactionReceipt通过这种方式老的API接口获取API，只能获取当前一个回执单。但是如果用新的API获取，读取本地的文件，就可以拿到当前帐号历史上的购买信息。能看出有563次购买记录。
2. 如果要替换新的API，那么服务器对于返回字段的解析，也需要配合修改。苹果校验接口返回数据的格式变了。

第二个结论很明显，只要对比一下数据就能知道结果。主要剖析一下第一个结论的来龙去脉。

#旧API校验返回
  

  
~~~
{
    receipt =    {
        bid = "com.中间省略ideo";
        bvrs = "5.7.0.1";
        "item_id" = 921中间省略770;
        "original_purchase_date" = "2016-05-中间省略26:14 Etc/GMT";
        "original_purchase_date_ms" = 1463714774323;
        "original_purchase_date_pst" = "2016-05中间省略26:14 America/Los_Angeles";
        "original_transaction_id" = 10000中间省略93114;
        "product_id" = 1001;
        "purchase_date" = "2016-05-2中间省略26:14 Etc/GMT";
        "purchase_date_ms" = 14637中间省略323;
        "purchase_date_pst" = "2016-05-中间省略6:14 America/Los_Angeles";
        quantity = 1;
        "transaction_id" = 1000000中间省略93114;
        "unique_identifier" = 2af4e24b8d5afc3中间省略96b0be30ef60af7f409;
        "unique_vendor_identifier" = "E5E4FCA4-F中间省略4-9899-D328AFC206FE";
    };
    status = 0;
}
~~~

#新API校验返回


![Result Shot]({{ site.url }}/assets/snip20160528_1.png)


对比[苹果的文档](https://developer.apple.com/library/ios/releasenotes/General/ValidateAppStoreReceipt/Chapters/ValidateRemotely.html#//apple_ref/doc/uid/TP40010573-CH104-SW4)

格式都能对上。
563条纪录里面是什么内容，这段话说的很清楚，

~~~
In-App Purchase Receipt

The receipt for an in-app purchase.

ASN.1 Field Type 17

ASN.1 Field Value SET of in-app purchase receipt attributes

JSON Field Name in_app

JSON Field Value array of in-app purchase receipts

In the JSON file, the value of this key is an array containing all in-app purchase receipts. In the ASN.1 file, there are multiple fields that all have type 17, each of which contains a single in-app purchase receipt.

The in-app purchase receipt for a consumable product or non-renewing subscription is added to the receipt when the purchase is made. It is kept in the receipt until your app finishes that transaction. After that point, it is removed from the receipt the next time the receipt is updated—for example, when the user makes another purchase or if your app explicitly refreshes the receipt.

The in-app purchase receipt for a non-consumable product, auto-renewable subscription, or free subscription remains in the receipt indefinitely.
~~~

同时解释了，为啥有的购买类型能够Restore，而有的类型，不能Restore。Restore的内部实现方式。
这一段，说得真清晰。果然印证了之前彩琴的猜测,但是有一点彩琴猜错了，并没有包含所有的信息。具体包含了哪些，看上方文档。

偶尔也会返回这样的数据

~~~
<html><head><title>Error</title></head><body>Your request produced an error.  <BR>[newNullResponse]</body></html>
~~~


#新API请求
新的API请求，是获取本地存储的一个文件，然后进行base64编码   
能看出两次购买，这个文件的大小是累加的，    
第一次到第二次的大小变化。多了315个字节。   
190,823 字节（磁盘上的 193 KB）    
191,138 字节（磁盘上的 193 KB）   
用文本编辑器打开也可以看出一些端倪，能看到一些日期信息。  
![Result Shot]({{ site.url }}/assets/snip20160528_2.png)

费了好久才把这个文件解析了，解析过程在最下方。


#旧API请求

旧的API请求数据 NSData  transaction.transactionReceipt，通过UTF8编码，转换成一个明文JSON。可以看出，包含了这一次请求的数据。

有这么几个key。

~~~
{
     "signature" = "A1TqA中间省略很多==";
     "purchase-info" = "ewoJImTI2IDA3OjMzOjA中间省略很多0IEV0Yy9HTVQiOwp9";
     "environment" = "Sandbox";
     "pod" = "100";
     "signing-status" = "0";
}
~~~

#文件解析
从上文看出确实是包含了所有的购买信息。  
很好奇，这个文件是神马玩意，直接用UTF8解码也解码不了。 放狗搜了一下，再次拜服谷歌。找到一篇objc.io 上面的文章[receipt validation](https://www.objc.io/issues/17-security/receipt-validation/) 。  
读了一下，需要用OpenSSL解密。Cocoapods竟然已经支持了，直接集成进来。
无意间链接到[ValidateAppStoreReceipt Locally](https://developer.apple.com/library/ios/releasenotes/General/ValidateAppStoreReceipt/Chapters/ValidateLocally.html#//apple_ref/doc/uid/TP40010573-CH1-SW19) ，
其实我在做的事情，就是本地验证，之前一直没有看这块内容。

我把代码上传了：[toolazytoname/ReceiptValidation](https://github.com/toolazytoname/ReceiptValidation)
