---
layout: post
title:  "IAP掉单优化"
date:   2016-12-07 13:27:32 +0800
categories: FDTool
---

IAP掉单优化。

**目录**

* [0 前言](#preface)
* [1 总体策略](#strategy)
* [2 客户端](#client)
* [3 服务端](#server)
* [4 计算掉单率](#calculate)
* [5 报表获取](#reporter)
* [6 疑惑](#question)
* [7 Reference](#reference)


# 0 前言<a name="preface"></a>

公司的IAP做得不太好，上次也写了一篇相关的文章[《IAP回执单新API》]({{ site.url }}/ios/2016/05/28/iap-new-receipt-api-replace.html)。做苹果的IAP很容易会有掉单的情况发生，我认为微信淘宝支付很大程度上考验的是微信淘宝的技术水平，IAP考验的是咱们自己开发团队的能力，包括到服务端团队和客户端团队。


# 1 总体策略<a name="strategy"></a>



1. 处理退款的订单，挤掉水分。
2. 一定要换成新的API
3.  App客户端和App服务器之间的通信通道最好能加密，加个sign，或者key啥的。
4. 看目前客户端重试策略是否完善
    1. 包括在didFinishLaunchingWithOptions里面addTransactionObserver以后，下面这个方法返回上次没有finish的交易后有没有妥善处理。
     
     ~~~ 
    - (void)paymentQueue:(SKPaymentQueue *)queue updatedTransactions:(NSArray *)transactions 
    ~~~
    
    2. 请求回执单验证成功的接口一次没有成功，后续的重试是否会成功，开发一定要进行自测。

 
# 2 客户端<a name="client"></a>

1. 替换成新的API
 
 ~~~
NSData *transactionReceipt = [NSData dataWithContentsOfURL:[[NSBundle mainBundle] appStoreReceiptURL]];
~~~

2. 把finishTransaction移到交验接口成功的回掉里面去。（未做）
4. App客户端和App服务器之间的通信通道要加密。（未做）


# 3 服务端

1. 兼容新的API。
    1. 当利用App Receipt来验证IAP订单时，我们需要验证的是在App Reciept中所包含的IAP receipt列表（in_app节点）。与iOS 7.0之前的方式相比，这种方式的明显区别是：它包含一个IAP receipt列表而不是仅仅一个IAP receipt。这使它本身带有某种程度的自动修复的特性。如果用户某次支付没有被正确完成也没有后续被成功恢复，那么当他在同一个手机设备上产生下一次支付行为时，App Receipt中就会包含前后两次支付的IAP receipt，这就能让上次失败的订单一并恢复。
    2. 之前也换过新的API，之所以不用等原因是，有一个测试账号，有五六百条记录，苹果会返回异常信息。详细可以参考上一篇文章[《IAP回执单新API》]({{ site.url }}/ios/2016/05/28/iap-new-receipt-api-replace.html)。一般会员也不会产生如此多的购买记录。
2. 关于退款的订单。
    1. 用户退款的订单有可能依然在App Receipt中出现，因此App服务器实现验证的时候需要能够识别出已经被退款的订单。被退款订单的唯一标识是：它带有一个[cancellation_date字段](https://developer.apple.com/library/content/releasenotes/General/ValidateAppStoreReceipt/Chapters/ReceiptFields.html#//apple_ref/doc/uid/TP40010573-CH106-SW1)。
3. App客户端和App服务器之间的通信通道要加密。
    1. 对解决串单问题，也是有帮助的。
4. 正式环境，转沙盒测试环境的过程，没有一个逻辑校验的过程，我认为需要维护一个白名单把开发账号加进去。
5. 串单问题
    1. 服务端，可取消订单对应的产品ID验证逻辑，这种没有对应公司订单的交易也应该加上会员权限。之前客户端为了修改这个问题，把公司的订单号放到payment.applicationUsername中，一般也都会带上，也有返回为空的情况。
      
       ~~~
       SKMutablePayment *payment = [SKMutablePayment paymentWithProduct:product];
       if ([[ConfigurationCenter sharedCenter].systemVersion floatValue] >= 7.0) {
            payment.applicationUsername = self.orderSN;
        }
     ~~~
     
6. 解析苹果后的逻辑
    1. 如果是返回的错误码是21007，转到测试环境校验。
    2. bundle_id验证逻辑，验证是否是来自自家客户端，
    3. 如果要校验历史上有没有掉单的情况，是不是需要保存每笔交易的苹果transaction_id，看看有没有对应的历史交易记录存着。


# 4 计算掉单率<a name="calculate"></a>
1. 最好是用销量来统计，而不是销售额。
2. 分子，用服务端访问苹果服务器，回执单上解析结果的时间。
3. 分母，一定时间范围内苹果的销量。从报表获取https://reportingitc.apple.com/autoingestion.tft。


这样，分子，分母都是来自苹果，之前，统计的时候，分子的时间参考的是公司后台服务器鉴权成功的时间。所以会出现大于1的情况，太扯了。


# 5 报表<a name="reporter"></a>

苹果文档[Official Reporter tool from Apple](https://help.apple.com/itc/appsreporterguide/)

~~~
➜  Reporter java -jar Reporter.jar p=Reporter.properties Sales.getAccounts
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Accounts>
    <Account>
        <Name>####.com Inc. (NASDAQ: ####)</Name>
        <Number>######</Number>
    </Account>
</Accounts>
~~~

~~~
➜  Reporter java -jar Reporter.jar p=Reporter.properties  Sales.getStatus
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Status>
    <Code>0</Code>
    <Message>Sales and Trends Reporter is currently available.</Message>
</Status>
~~~

~~~
➜  Reporter java -jar Reporter.jar p=Reporter.properties m=Robot.XML Sales.getReport ########, Sales, Summary, Daily, 20161101
<?xml version="1.0" encoding="UTF-8" standalone="yes"?> <Output>     <Message>Successfully downloaded S_D_80090645_20161101.txt.gz</Message> </Output>

~~~



# 6 疑惑<a name="question"></a>

1. 用户拿到的信息和开发拿到的信息能否关联起来？？？以应对投诉时去区分这个用户是否是恶意投诉
在[这篇博客](http://blog.csdn.net/teng_ontheway/article/details/47023119)中
里面有下面这段话，用户拿到的信息和开发拿到的信息能关联起来？？？
 
 
 ~~~
这种情况在以往的经验中也会出现，常见的玩家和游戏运营商发生的纠纷。游戏客服向玩家索要游戏账号和appstore的收据单号，通过查询itunes-connect看是否确有这笔订单。如果订单存在，则要联系研发方去查询游戏服务器，看订单号与玩家名是否对应，并且是否已经被使用了，做这一点检查的目的是 为了防止恶意玩家利用已经使用过了的订单号进行欺骗(已验证的账单是可以再次请求验证的,曾经为了测试,将账单手动发给服务器处理并成功)，谎称自己没收到商品。这就是上面一节IAP Server Model中红字所提到的安全逻辑的目的。当然了，如果查不到这个订单号，就意味着这个订单确实还没使用过，手动给玩家补发商品即可。
~~~


2. payment.applicationUsername 何时为空
之前偶尔在苹果开发者论坛看到过未验证。说是初次进行内购的时候，第一次是我发起的，会带上这个字段信息。在用户输完手机号以后，苹果又会发起一次，这次就不会带这个字段了。返回时，也自然就空了。

    
# 7 参考<a name="reference"></a>
   1. 这篇文章写得很好给了我很大的启发[苹果IAP开发中的那些坑和掉单问题](http://zhangtielei.com/posts/blog-iap.html)
