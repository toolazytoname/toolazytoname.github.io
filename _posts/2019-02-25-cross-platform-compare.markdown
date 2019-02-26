---

layout: post
title:  "跨平台框架比较"
date:   2019-2-25 23:17:32 +0800
categories: iOS
catalog:  true
tags:
  - iOS
---

洗稿一篇，特地把参考文章放在最上面。

# 参考

1. [移动端跨平台开发的深度解析](https://juejin.im/post/5b395eb96fb9a00e556123ef )
2. [如何评价 Google 的 Fuchsia、Android、iOS 跨平台应用框架 Flutter？](https://www.zhihu.com/question/50156415) 





# 表格对比

| 类型               | React Native                   | Weex                                                     | Flutter                                                     |
| ------------------ | ------------------------------ | -------------------------------------------------------- | ----------------------------------------------------------- |
| 平台实现           | JavaScript                     | JavaScript                                               | 无桥接，原生编码                                            |
| 引擎               | JSCore                         | JS V8                                                    | Flutter engine                                              |
| 核心语言           | React                          | Vue                                                      | Dart                                                        |
| apk 大小 (Release) | 7.6M                           | 10.6M                                                    | 8.1M                                                        |
| bundle文件大小     | 默认单一、较大                 | 较小、多页面可多文件                                     | 不需要                                                      |
| 社区               | 第三方库丰富，Facebook重点维护 | 2016年开源至今，社区和各类文档都显得有点疲弱，托管apache | 刚刚出道小鲜肉，拥护者众多                                  |
| star 数            | 74,351                         | 11,819                                                   | 54,180                                                      |
| 背后大佬           | Facebook                       | Alibaba                                                  | Google                                                      |
| 支持               | Android、IOS                   | Android、IOS、Web                                        | Android、IOS，谷歌新操作系统 Fuchsia 使用Flutter 作为UI框架 |
| 热更新             | 支持                           | 支持                                                     | 目前不支持                                                  |

# 文字补充

1. 大小 

   上面apk大小是通过 react-native init、weex create 和 flutter 创建出的工程后，直接不添加任何代码，打包出来的 release 签名 apk 大小。

2. 社区 

   1. react native 作为 Facebook 主力开源项目之一，至今已有各类丰富的第三方库，甚至如 realm、lottie 等开源项目也有 react native 相关的版本，社群实际无需质疑
   2. weex 的设计和理念都很优秀，性能也不错，但是对比 react native 的第三方支持，就远远不如了。2016年开源至今，社区和各类文档都显得有点疲弱，作为跨平台开发人员，大多时候肯定不会希望，需要频繁的自己增加原生功能支持，因为这样的工作一多，反而会与跨平台开发的理念背道而驰，带来开发成本被维护难度增加。
   3. Flutter目前正在快速发展，谷歌的号召力一直很可观

3. 性能。

   1. Flutter 由于渲染的基础（gdi）是自己实现的，所以实现跨平台、性能优化、摆脱平台约束方面的裕度更大。从实际体验来看， Flutter 的性能比 RN 要高不少。
   2. 运行时：从前端的思维来看，jsx 或 dart 都是一种声明式的写法，但 jsx 需要转译（工程上看起来美好的东西肯定是需要在别的方面消耗更多），dart 是直接语言层面支持了 node tree 的书写，且对象创建成本低，可直接编译成 native 代码（AOT），VM 效率更高。运行上应该是 dart 效率高很多。
   3. 渲染机制：RN 是从前端思想出发的框架，其在表达复杂 UI 时需要依赖前端“盒子”的深层次叠加嵌套，在 RN 背景下，这每个“盒子”都是一个 native 的 view，这时候就相比 native 开发来说多了很多 view 对象，造成了性能降低。也就是说复杂 UI 需求下，RN 对 UI 的表达效率远低于 native 造成性能低下（Facebook 后来做了一个项目 litho 的亮点就在于打平布局层次，针对性优化我说的布局表达效率低下这一点）。Flutter 是基于 skia (gdi) 层面往上去做的，每个 node/布局是否一定需要是一个 layer 以及 render tree 怎么来划分和实现都有更多灵活性和性能优化的空间，所以能做到性能更优。
   4. 兼容性：Flutter 提供的 widget 都是基于 skia 来实现和精心定制的，与具体平台没关，所以能保持很高的跨 os 跨 os version 的兼容性。

4. 跨平台

   RN 是一套概念/设计理念跨越两个平台，具体到实际平台上去还要去适配和桥接差异性（这其中有巨大的工程成本和性能牺牲，比如做动画，js 就绝对不能用，用了性能就差了）。RN 更适合称为：将一种设计理念延展到两个平台，不能称其为“一套代码，自动部署多平台”的跨平台方案。

   1. WEEX ,虽然做到了“Write once, run everywhere”，但它的定义更像是：**写个 vue 前端，顺便帮你编译成性能还不错的 apk 和 ipa**（当然，现实有时很骨感）。基于 Vue 设计模式，支持 web、android、ios 三端，原生端同样通过中间层转化，将控件和操作转化为原生逻辑来提高用户体验。
   2. Flutter 至少做到了一套代码（不涉及平台 api 层面的 UI 及纯事件响应可以完全一样）。Flutter 相对来说是做到了跨平台。

5. 未来

   1. 由于 Flutter 从更基础的层去抹平平台差异，Flutter 站在了更宽广、更可控的一个基础平台上去演变和发展。
   2. RN 永远需要 follow native 开发的这套约束，桥接和抹平差异乃至应用层去适配的成本、面对具体场景去优化性能所需要的成本都是居高不下的。RN （动态化当然是首要好处，这是这份回答的隐含前提）属于“大公司扛大旗，赚吆喝，小公司跟着复用下现有资源”。
   3. Weex同RN差不多。

6. 谁在用

   1.  [“Airbnb 宣布放弃使用 React Native，回归使用原生技术”](https://link.juejin.im?target=https%3A%2F%2Fwww.colabug.com%2F3238051.html) : Airbnb 作为 react native 平台上最大的支持者之一，其开源的lottie 同样是支持原生和 react native。
   2. Flutter ：在国内有咸鱼，美团，腾讯Now直播，京东金融等。

7. 不足

   1. Weex的多页面实现问题

      1. weex 在 native 端是不支持 <keep-alive>的，这一点和 react-native 不同在与，如果在 native 需要实现页面跳转，使用 vue-router 将会惨不忍睹：返回后页面不做特别处理时，是会空白一片。参考官方Demo [playground](https://link.juejin.im/?target=https%3A%2F%2Fgithub.com%2Fapache%2Fincubator-weex%2Ftree%2Fmaster%2Fandroid%2Fplayground)，native 端 的采用 weex.requireModule('navigator')跳转 Activity 是才正确实现。
      2. 同时，weex中 navigator 跳转的设计，也导致了多页面的页面间通讯的差异。weex在多页面下的数据通讯，是通过url实现的，比如<file://assets/dist/SecondPage.js?params=0>，而vuex和vue-router在跨页面是无法共用的；而 react native 在跨 Actvity 使用时，因为是同一个bundle文件，只要 manager 相同，那么 router 和 store 时可以照样使用的，数据通信方式也和单个 Actvity 没区别。 

   2. Flutter

      1. 目前成熟度有限

      2. Dart 偏小众

      3. Dart 缺少语法糖,嵌套下来的代码有点不忍直视

      4. 嵌入外部 platform view 成本高，官方现有集成方案对现有工程配置和打包流程有侵入，需要改造。理想状态下，不开发flutter同事不需要安装flutter 环境。

         



#  选择

综上对比，技术团队比较倾向于flutter

1. 性能是最好的。咸鱼在论坛上发表了和flutter和RN的对比，结论是中高端机型上Flutter和Native不相上下，在低端机型上，Flutter会比Native更加的流畅，其实闲鱼团队在使用Flutter做详情页过程中，没有更多地关注性能优化，为了更快地上线，也是优先功能的实现，不过测试结果出来之后，却出乎意料地优于原先的Native的实现。具体数值，参考下面第二条参考文献。
2. 对比另外两套方案，Flutter 从实现原理层面摆脱了对JS Framework或者JSCore的依赖，釜底抽薪， 站在了更宽广、更可控的一个基础平台上去演变和发展。
3. 因为成熟度不足，同时为了规避风险，可以结合ABtest，和页面降级方案，同步上线。咸鱼在宝贝详情页以上线flutter。

​	


