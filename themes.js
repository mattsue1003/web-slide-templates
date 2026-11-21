/* 範本：配色、字型、裝飾，加上一份示範內容 */
(function () {
  'use strict';
  const F = {
    sans: "'Noto Sans TC','PingFang TC','Microsoft JhengHei',sans-serif",
    serif: "'Noto Serif TC','Songti TC','PMingLiU',serif",
    round: "'Huninn','Noto Sans TC','PingFang TC',sans-serif",
    hand: "'LXGW WenKai TC','Noto Sans TC','PingFang TC',sans-serif",
    play: "'Playfair Display','Noto Serif TC',serif",
    grot: "'Space Grotesk','Noto Sans TC',sans-serif",
  };
  const G = {
    sans: 'Noto Sans TC:wght@400;700;900',
    serif: 'Noto Serif TC:wght@400;700;900',
    round: 'Huninn',
    hand: 'LXGW WenKai TC:wght@400;700',
    play: 'Playfair Display:ital,wght@0,700;0,900;1,400',
    grot: 'Space Grotesk:wght@500;700',
    mono: 'JetBrains Mono:wght@500',
  };

  const SAMPLES = {
    health: `=== 封面
# 吃對三餐，血糖更穩定
## 糖尿病的日常飲食管理
社區健康講座 · 衛教師 王小明
備註：大家好，今天想跟大家聊聊每天三餐怎麼吃，血糖會比較穩。

=== 目錄
# 今天會聊到
- 血糖為什麼會忽高忽低
- 餐盤怎麼分配
- 外食的聰明選擇
- 一起來做小測驗
備註：今天分成四個部分，最後還有一個小測驗，大家可以一起猜猜看。

=== 章節
# 認識血糖
## 先了解身體怎麼處理食物
備註：先從基本的開始：吃下去的東西，身體是怎麼變成血糖的。

=== 重點
# 血糖穩定的三個原則
- **定時定量**：三餐時間固定，份量差不多
- **先吃菜、再吃肉**，最後才吃飯
- **少喝含糖飲料**，口渴先喝白開水
備註：可以先問台下「平常最常喝什麼飲料？」再帶到這三個原則。

=== 數字
# 糖尿病餐盤法
- 1/2 | 非澱粉類蔬菜
- 1/4 | 豆魚蛋肉類
- 1/4 | 全穀雜糧類
用一個餐盤就能估算份量，不用每餐秤重
備註：請大家拿出自己的盤子想像一下：一半是菜，剩下兩格各放一種。

=== 左右
# 早餐這樣換
## 原本的早餐
- 奶茶配蛋餅
- 甜麵包
- 果汁
## 換一下更好
- 無糖豆漿
- 全麥吐司夾蛋
- 一份完整水果
備註：這頁請大家舉手：早餐常吃左邊的人有多少？換成右邊其實不難。

=== 步驟
# 外食四個小技巧
- 看：先看有沒有蔬菜
- 換：白飯換五穀飯或減半
- 去：去掉勾芡和油炸外皮
- 慢：每口多嚼幾下，慢慢吃
備註：外食族最常問的問題，記住「看、換、去、慢」四個字就好。

=== 引言
> 不是不能吃，而是要知道怎麼吃、吃多少。
— 糖尿病衛教的核心觀念
備註：這句話請大家跟著我念一次，記得最清楚。

=== 圖文
# 餐盤怎麼放
![一個分成三區的餐盤：蔬菜、蛋白質、全穀]()
- 一半放蔬菜
- 四分之一放豆魚蛋肉
- 四分之一放全穀雜糧
備註：如果有實體餐盤教具，這時候可以拿出來示範。

=== 問答
# 哪一種最適合當作日常解渴的飲料？
- [ ] 運動飲料
- [ ] 100% 果汁
- [x] 白開水或無糖茶
- [ ] 調味乳
解答：白開水和無糖茶不含糖，最不會讓血糖上升；果汁和運動飲料都含有不少糖。
備註：先讓大家猜，舉手投票，再公布答案。

=== 結尾
# 謝謝聆聽
## 有問題歡迎提出來討論
下次回診，記得帶著血糖紀錄本
備註：謝謝大家，提醒下次回診帶血糖紀錄本，有問題現在可以問我。`,

    elder: `=== 封面
# 在家走得穩，不跌倒
## 長輩居家防跌小撇步
健康促進課程 · 職能治療師
備註：各位長輩好，今天我們來聊怎麼在家走得穩、不跌倒。

=== 目錄
# 今天講四件事
- 為什麼會跌倒
- 家裡哪裡最危險
- 簡單的腿力運動
- 起床的好習慣
備註：今天講四件事，講完我們一起動一動。

=== 章節
# 家裡哪裡最危險
## 一起來找找看
備註：先請大家想一想，自己家裡哪個地方最容易滑倒？

=== 重點
# 浴室要注意
- 地板放**止滑墊**
- 馬桶旁裝**扶手**
- 洗澡坐**洗澡椅**
備註：浴室最濕最滑，這三樣東西很便宜，一定要裝。

=== 左右
# 晚上起床上廁所
## 危險的做法
- 摸黑走路
- 急著站起來
## 安全的做法
- 開小夜燈
- 先坐一下再站
備註：晚上起床最危險，請長輩分享一下自己的習慣。

=== 數字
# 記住「三個半分鐘」
- 半分鐘 | 醒來先躺著
- 半分鐘 | 坐在床邊
- 半分鐘 | 站著扶穩再走
備註：這個口訣很好記：躺半分鐘、坐半分鐘、站半分鐘。

=== 步驟
# 椅子起立運動
- 坐好：坐在椅子前半段
- 向前：身體微微往前傾
- 站起：雙腳用力站起來
- 坐下：慢慢坐回去，做 10 次
備註：請大家一起站起來，扶著椅背跟著我做一次。

=== 引言
> 慢慢來，比較快。
— 給每一位長輩的提醒
備註：這句話送給大家，慢慢來才不會受傷。

=== 圖文
# 這樣的鞋子比較好
![一雙包鞋：鞋底止滑、後跟包覆]()
- 鞋底要止滑
- 腳後跟要包住
- 不穿拖鞋出門
備註：可以請長輩看看自己腳上的鞋子，符不符合這三點。

=== 問答
# 晚上起床想上廁所，第一步應該？
- [ ] 馬上站起來快走
- [x] 先在床邊坐一下
- [ ] 不開燈摸黑走
解答：先坐一下，讓身體適應，頭比較不會暈，就不容易跌倒。
備註：請大家舉手選答案，答對的給自己拍拍手。

=== 結尾
# 謝謝大家
## 回家就從開一盞小夜燈開始
備註：謝謝大家，今天回家就開一盞小夜燈。`,

    class: `=== 封面
# 番茄鐘工作法
## 用 25 分鐘，找回專注力
學習策略工作坊 · 第 3 週
備註：今天來學一個簡單的專注方法，名字叫番茄鐘。

=== 目錄
# 這堂課的流程
- 為什麼我們容易分心
- 番茄鐘怎麼做
- 做與不做
- 課堂練習
- 小測驗
備註：這堂課有五個段落，最後會實際練習一顆番茄。

=== 章節
# 番茄鐘怎麼做
## 簡單到今天就能開始
備註：先來看番茄鐘怎麼做，其實非常簡單。

=== 重點
# 分心的三個常見原因
- 手機通知一直跳出來
- 任務太大，不知道從哪開始
- 沒有休息，越讀越累
備註：請同學想一想，自己最常因為哪一個原因分心？

=== 步驟
# 一顆番茄的流程
- 選任務：挑一件要完成的事
- 專注 25 分：計時開始就不分心
- 休息 5 分：起來走走、喝水
- 第四顆後：休息 15～30 分鐘
備註：一顆番茄就是這四步，重點是專注時真的不碰手機。

=== 數字
# 一顆番茄的組成
- 25 分 | 專心做一件事
- 5 分 | 短暫休息
- 4 顆 | 之後安排一次長休息
備註：把數字記起來：25、5、4，這就是一輪的節奏。

=== 左右
# 做與不做
## 建議這樣做
- 手機放到另一個房間
- 每顆番茄只做一件事
## 盡量避免
- 休息時滑手機停不下來
- 一次排太多顆番茄
備註：左邊是建議做法，右邊是常踩的坑，大家對照一下自己。

=== 引言
> 專注不是靠意志力，而是靠設計好的環境。
— 本堂課的關鍵一句話
備註：這句話是今天最想讓大家帶走的一句。

=== 圖文
# 課堂練習
![番茄造型的計時器]()
- 寫下今天最想完成的一件事
- 一起計時 25 分鐘
- 結束後分享你完成了多少
備註：現在拿出紙筆，我們一起計時 25 分鐘。

=== 問答
# 經典番茄鐘的專注時間是多久？
- [ ] 10 分鐘
- [x] 25 分鐘
- [ ] 60 分鐘
- [ ] 不限時間
解答：經典的番茄鐘是專注 25 分鐘、休息 5 分鐘，可以依自己的狀況調整。
備註：先猜答案再公布，答錯也沒關係。

=== 結尾
# 今天就種下第一顆番茄
## 下週分享你的番茄紀錄
備註：下週上課請分享你這週種了幾顆番茄。`,

    report: `=== 封面
# 社區長者健康促進方案
## 期末成果報告
第三組 · 2026 年 12 月
備註：老師、同學好，我們是第三組，今天報告社區長者健康促進方案。

=== 目錄
# 報告大綱
- 方案背景
- 執行過程
- 成果數據
- 檢討與建議
備註：報告分成四個部分，大約十分鐘。

=== 章節
# 方案背景
## 為什麼選這個社區
備註：先說明我們為什麼選這個社區。

=== 重點
# 我們看到的需求
- 社區長者比例偏高
- 長者白天多獨自在家，活動量少
- 據點缺少固定的健康課程
備註：這些需求是我們訪談長者和據點人員整理出來的。

=== 步驟
# 執行過程
- 需求評估：訪談與問卷
- 課程設計：8 週健康課程
- 實際執行：每週一次 90 分鐘
- 成效評估：前後測比較
備註：整個方案分四個階段，從評估到成效檢核。

=== 數字
# 成果一覽
- 8 週 | 完成全部課程
- 24 位 | 長者參與
- 92% | 平均出席率
示範數字，請換成你們的實際資料
備註：這是成果數字，出席率是我們最驕傲的部分。

=== 左右
# 課程前後的改變
## 課程前
- 多數人說不出防跌重點
- 每週運動不到 1 次
## 課程後
- 能說出 3 個防跌重點
- 多數人每週運動 2 次以上
備註：前後測的差異，是我們判斷方案有沒有效的依據。

=== 圖文
# 活動照片
![長者在據點一起做伸展運動]()
- 每週固定暖身與伸展
- 搭配小組討論與分享
備註：這是活動當天的照片，可以看到大家參與的樣子。

=== 引言
> 以前在家都沒事做，現在每週都很期待來上課。
— 參與課程的長者回饋
備註：這段話是長者親口說的，讓我們很感動。

=== 問答
# 你覺得這個方案最需要改進的是？
- [ ] 課程時間
- [ ] 上課地點
- [ ] 課程內容
- [ ] 宣傳方式
解答：歡迎老師和同學提供建議，我們會整理進最後的檢討報告。
備註：最後想聽聽大家的建議，請直接選一個。

=== 結尾
# 謝謝聆聽
## 敬請指教
第三組 全體組員
備註：以上是我們的報告，敬請老師和同學指教。`,

    event: `=== 封面
# 社區健康園遊會
## 一起動起來，健康玩一天
12 月 20 日（六）上午 9:00 · 社區活動中心
備註：歡迎大家！先來介紹這次的社區健康園遊會。

=== 目錄
# 活動亮點
- 免費健康檢測
- 親子運動闖關
- 健康餐點試吃
- 集章換小禮物
備註：今天有四大亮點，大人小孩都能玩。

=== 章節
# 活動內容
## 大人小孩都能玩
備註：接下來看活動內容有哪些。

=== 左右
# 闖關區
## 親子組
- 投籃大挑戰
- 平衡木小勇士
## 長輩組
- 套圈圈
- 手指操接力
備註：闖關分親子組和長輩組，可以全家一起來。

=== 步驟
# 參加方式
- 報名：掃描 QR Code 線上報名
- 報到：當天到服務台領闖關卡
- 闖關：完成 5 關集章
- 兌換：集滿章換小禮物
備註：參加只要四個步驟，現場也有志工幫忙。

=== 數字
# 活動資訊
- 9:00 | 開始報到
- 12 關 | 闖關遊戲
- 300 份 | 小禮物，送完為止
備註：記住時間：九點開始報到，小禮物送完為止。

=== 重點
# 現場服務
- 血壓、血糖免費檢測
- 營養師一對一諮詢
- 志工協助長輩參加
備註：現場也有健康檢測和營養諮詢，可以順便做。

=== 圖文
# 活動地點
![社區活動中心外觀與交通路線]()
- 社區活動中心 1 樓廣場
- 附近有公車站
- 現場有無障礙坡道
備註：活動地點在活動中心一樓廣場，交通很方便。

=== 引言
> 健康，從一起動起來開始。
— 主辦單位
備註：這是我們想傳達的一句話。

=== 問答
# 你最想參加哪一區？
- [ ] 健康檢測區
- [ ] 闖關遊戲區
- [ ] 健康餐點區
- [ ] 集章兌換區
解答：每一區都有小驚喜，記得帶闖關卡來集章！
備註：請大家投票，看看哪一區最受歡迎。

=== 結尾
# 我們現場見
## 報名請洽社區服務台
備註：我們現場見！報名可以到社區服務台。`,

    pitch: `=== 封面
# 校園減塑行動
## 從一杯飲料開始
專題提案 · 綠色行動小組
備註：大家好，我們是綠色行動小組，今天提案校園減塑行動。

=== 目錄
# 提案內容
- 問題在哪裡
- 我們的解法
- 執行計畫
- 需要的支持
備註：提案分四個部分，最後會說明需要的支持。

=== 章節
# 問題在哪裡
## 校園裡的一次性塑膠
備註：先來看我們觀察到的問題。

=== 數字
# 一週的觀察
- 1,200 杯 | 校內手搖飲杯數
- 6 成 | 使用塑膠吸管
- 3 處 | 回收站經常爆滿
示範數字，請換成你們實際觀察的結果
備註：這是我們花一週時間在校園實際統計的數字。

=== 重點
# 我們的解法
- 自備杯享**折扣 5 元**
- 校內設置**洗杯站**
- 每月公布**減塑排行榜**
備註：解法有三個，重點是讓大家「自然地」改變習慣。

=== 左右
# 現在 vs. 推動後
## 現在
- 一次性杯子到處都是
- 回收分類做不好
## 推動後
- 自備杯成為習慣
- 垃圾量明顯減少
備註：對照一下現在和推動後的校園。

=== 步驟
# 執行計畫
- 第 1 個月：宣傳與店家洽談
- 第 2 個月：洗杯站上線
- 第 3 個月：排行榜與獎勵
- 第 4 個月：成果統計
備註：我們規劃四個月完成，每個月都有清楚的目標。

=== 圖文
# 洗杯站示意
![設在飲料店旁邊的洗杯站]()
- 放在飲料店旁邊
- 有清潔劑與晾杯架
- 志工輪班整理
備註：洗杯站是整個計畫的核心，這是示意圖。

=== 引言
> 減塑不是犧牲方便，而是換一個更好的習慣。
— 綠色行動小組
備註：這句話代表我們的理念。

=== 問答
# 你願意為了 5 元折扣自備杯子嗎？
- [ ] 一定會
- [ ] 看情況
- [ ] 可能不會
解答：這正是我們想了解的，歡迎掃碼填問卷，讓提案更完整。
備註：想請大家投票，幫我們了解大家的意願。

=== 結尾
# 一起讓校園更綠
## 謝謝聆聽，期待您的支持
備註：謝謝聆聽，期待學校和同學的支持。`,
  };

  const THEMES = [
    {
      id: 'sunrise', name: '晨光暖杏', tags: ['衛教', '長者'], sample: 'health', tr: 'rise',
      desc: '奶油杏色配上陶土橘，圓體字親切溫暖，適合社區衛教講座。',
      fonts: [G.round, G.sans],
      vars: { bg: '#FBF6EE', fg: '#2E2A25', muted: '#776B5F', ac: '#C95F33', ac2: '#5F8B6B', card: '#FFFFFF', line: '#EADFCF', edge: '#E6DBCB', secBg: '#C95F33', secFg: '#FFF8F0', secAc: '#FFE1C7', hf: F.round, bf: F.sans, hw: 400, rad: '28px' },
      css: `.deco::before{content:'';position:absolute;width:560px;height:560px;border-radius:50%;background:radial-gradient(circle,#F6D7BB 0,rgba(246,215,187,0) 68%);right:-170px;top:-200px}
.deco::after{content:'';position:absolute;width:300px;height:300px;border-radius:50%;background:radial-gradient(circle,#DCE8D8 0,rgba(220,232,216,0) 68%);left:-110px;bottom:-130px}
.t-section .deco::before{background:radial-gradient(circle,rgba(255,255,255,.2),rgba(255,255,255,0) 68%)}
.t-section .deco::after{background:radial-gradient(circle,rgba(255,255,255,.14),rgba(255,255,255,0) 68%)}
.col,.st,.frame,.opt{box-shadow:0 12px 32px rgba(120,80,40,.08)}`,
    },
    {
      id: 'clinic', name: '清透醫療藍', tags: ['衛教', '報告'], sample: 'health', tr: 'fade',
      desc: '白底、深藍字、藍綠漸層線條，乾淨專業，適合醫院與診所的衛教。',
      fonts: [G.sans],
      vars: { bg: '#FFFFFF', fg: '#13283F', muted: '#566779', ac: '#1F6FD1', ac2: '#0F9A90', card: '#F1F6FC', line: '#DCE6F0', edge: '#DCE5EF', secBg: '#12355E', secFg: '#FFFFFF', secAc: '#7CC0FF', hf: F.sans, bf: F.sans, hw: 700, rad: '14px' },
      css: `.deco::before{content:'';position:absolute;left:0;right:0;top:0;height:10px;background:linear-gradient(90deg,#1F6FD1,#0F9A90)}
.t-cover .deco::after,.t-end .deco::after{content:'';position:absolute;right:110px;top:50%;width:250px;height:250px;margin-top:-125px;background:linear-gradient(#E7F0FB,#E7F0FB) center/78px 250px no-repeat,linear-gradient(#E7F0FB,#E7F0FB) center/250px 78px no-repeat}
.t-end .deco::after{right:auto;left:110px;opacity:.7}
.t-section .deco::before{background:linear-gradient(90deg,#7CC0FF,#5FE0D2)}
h2{padding-left:24px;border-left:8px solid var(--ac)}
.t-quiz h2,.t-quote h2{padding-left:0;border:0}`,
    },
    {
      id: 'ocean', name: '海洋青波', tags: ['衛教', '活動'], sample: 'health', tr: 'rise',
      desc: '淺青色底和柔和的海浪曲線，清爽明亮，適合健康促進與運動主題。',
      fonts: [G.sans],
      vars: { bg: '#F1FAFA', fg: '#0E3A43', muted: '#4D6F77', ac: '#0B8794', ac2: '#E08A1E', card: '#FFFFFF', line: '#CFE7E9', edge: '#D3EAEC', secBg: '#0B6F7A', secFg: '#FFFFFF', secAc: '#9BE7EE', hf: F.sans, bf: F.sans, hw: 900, rad: '22px' },
      css: `.deco::before{content:'';position:absolute;left:-10%;right:-10%;bottom:-130px;height:230px;border-radius:50% 50% 0 0;background:#DDF1F2}
.deco::after{content:'';position:absolute;left:-25%;right:30%;bottom:-175px;height:230px;border-radius:50% 50% 0 0;background:#CBEAEC}
.t-section .deco::before{background:rgba(255,255,255,.08)}
.t-section .deco::after{background:rgba(255,255,255,.07)}
.col,.st,.opt{box-shadow:0 10px 28px rgba(11,111,122,.08)}`,
    },
    {
      id: 'ink', name: '水墨書卷', tags: ['衛教', '長者', '課堂'], sample: 'elder', tr: 'fade',
      desc: '米白宣紙、淡淡墨暈和朱紅印章，典雅沉穩，長輩看了很親切。',
      fonts: [G.serif, G.sans],
      vars: { bg: '#F4EFE4', fg: '#1E1C1A', muted: '#665F55', ac: '#9E2B25', ac2: '#2F4A5A', card: '#FBF8F1', line: '#D9D0BF', edge: '#E0D8C8', secBg: '#1E1C1A', secFg: '#F4EFE4', secAc: '#D35A50', hf: F.serif, bf: F.sans, hw: 900, qw: 700, rad: '3px', cb: '1px' },
      css: `.deco::before{content:'';position:absolute;right:-120px;top:-90px;width:720px;height:480px;background:radial-gradient(ellipse at 60% 40%,rgba(30,28,26,.13),rgba(30,28,26,0) 62%);filter:blur(8px)}
.deco::after{content:'';position:absolute;left:60px;top:70px;bottom:70px;width:1px;background:rgba(30,28,26,.18)}
.t-section .deco::before{background:radial-gradient(ellipse at 60% 40%,rgba(255,255,255,.1),rgba(255,255,255,0) 62%)}
.t-section .deco::after{background:rgba(255,255,255,.15)}
.t-cover .bar{width:62px;height:62px;border-radius:6px;background:var(--ac);box-shadow:inset 0 0 0 4px #F4EFE4,inset 0 0 0 6px var(--ac)}
.bl li::before{border-radius:2px;transform:rotate(45deg);width:12px;height:12px}`,
    },
    {
      id: 'elder', name: '大字清楚', tags: ['長者', '衛教'], sample: 'elder', tr: 'fade',
      desc: '特大字、高對比、重點用黃色螢光標示，坐在後排的長輩也看得清楚。',
      fonts: [G.round, G.sans],
      vars: { bg: '#FFFCF2', fg: '#111111', muted: '#3F3F3F', ac: '#B23E08', ac2: '#1D5FA8', card: '#FFFFFF', line: '#D9CFB8', edge: '#EDE5D0', secBg: '#1D3557', secFg: '#FFFFFF', secAc: '#FFD166', hl: '#111111', hf: F.round, bf: F.sans, hw: 400, rad: '20px', cb: '3px' },
      css: `h2{font-size:62px}
.bl{gap:30px}.bl li{font-size:44px;padding-left:56px}.bl li::before{width:22px;height:22px;top:.5em}
.col li{font-size:36px}.col h3{font-size:40px}
.st b{font-size:76px}.st span{font-size:30px;color:var(--fg)}
.steps .stt{font-size:34px}.steps .sd{font-size:27px;color:var(--fg)}
.opt{font-size:34px}.ag li{font-size:40px}.sub{font-size:34px}
.t-cover h1{font-size:94px}.t-quote blockquote{font-size:60px}
strong{background:#FFE08A;padding:0 8px;border-radius:8px}
.t-section strong{color:#111}`,
    },
    {
      id: 'kraft', name: '牛皮紙溫度', tags: ['長者', '活動'], sample: 'elder', tr: 'fade',
      desc: '牛皮紙底、手寫感字體和虛線縫線，像手作海報一樣有溫度。',
      fonts: [G.hand, G.sans],
      vars: { bg: '#EADDC6', fg: '#3A2A1D', muted: '#6B5743', ac: '#A2461F', ac2: '#4C6A47', card: '#F5ECDC', line: '#C9B38D', edge: '#D3C2A2', secBg: '#4C6A47', secFg: '#F5ECDC', secAc: '#F2CD8C', hf: F.hand, bf: F.sans, hw: 700, rad: '10px', cb: '2px' },
      css: `.slide{background-image:radial-gradient(rgba(90,60,30,.07) 1px,transparent 1.6px);background-size:7px 7px}
.t-section{background-image:none}
.deco::before{content:'';position:absolute;inset:26px;border:2px dashed rgba(58,42,29,.22);border-radius:14px}
.t-section .deco::before{border-color:rgba(255,255,255,.25)}
.t-cover .deco::after{content:'';position:absolute;right:130px;top:100px;width:170px;height:170px;border:6px double rgba(162,70,31,.55);border-radius:50%;transform:rotate(-12deg)}
.col,.st,.opt,.frame{border-style:dashed}`,
    },
    {
      id: 'chalk', name: '黑板粉筆', tags: ['課堂'], sample: 'class', tr: 'fade',
      desc: '墨綠黑板、木頭邊框和粉筆黃，就像在教室上課，適合老師講課。',
      fonts: [G.hand],
      vars: { bg: '#24382E', fg: '#F3F0E6', muted: '#C3CCBF', ac: '#F5D46E', ac2: '#90D2F0', card: 'rgba(255,255,255,.06)', line: 'rgba(255,255,255,.2)', edge: '#16221C', secBg: '#1C2C24', secFg: '#F3F0E6', secAc: '#F5D46E', onAc: '#24382E', hf: F.hand, bf: F.hand, hw: 700, rad: '10px', cb: '2px' },
      css: `.slide{background:radial-gradient(ellipse at 30% 20%,#2D4538,#22352B 72%)}
.t-section{background:radial-gradient(ellipse at 70% 30%,#24382E,#18261F 75%)}
.deco::before{content:'';position:absolute;inset:0;border:16px solid #6A4A2E;box-shadow:inset 0 0 0 2px rgba(0,0,0,.3),inset 0 0 60px rgba(0,0,0,.3)}
.deco::after{content:'';position:absolute;left:120px;bottom:16px;width:150px;height:12px;border-radius:3px;background:linear-gradient(90deg,#F3F0E6 0 40px,transparent 40px 56px,#F5D46E 56px 92px,transparent 92px 108px,#90D2F0 108px)}
h2{text-decoration:underline wavy rgba(245,212,110,.55);text-decoration-thickness:3px;text-underline-offset:16px}
.bl li::before{border-radius:2px;width:20px;height:4px;top:.78em}
.col,.st,.opt{border-style:dashed}
.st b{font-weight:700}`,
    },
    {
      id: 'notebook', name: '方格筆記', tags: ['課堂', '報告'], sample: 'class', tr: 'rise',
      desc: '方格紙、紅色邊線、螢光筆劃重點，像整理得很漂亮的上課筆記。',
      fonts: [G.hand, G.sans],
      vars: { bg: '#FDFCF7', fg: '#23303B', muted: '#5F6B75', ac: '#D9482A', ac2: '#2479A3', card: '#FFFFFF', line: '#DEDACD', edge: '#E7E3D7', secBg: '#2479A3', secFg: '#FFFFFF', secAc: '#FFE66D', hl: 'inherit', hf: F.hand, bf: F.sans, hw: 700, rad: '4px', cb: '2px' },
      css: `.slide{background-image:linear-gradient(#ECE9DE 1px,transparent 1px),linear-gradient(90deg,#ECE9DE 1px,transparent 1px);background-size:32px 32px}
.t-section{background-image:none}
.deco::before{content:'';position:absolute;left:72px;top:0;bottom:0;width:2px;background:#F2A497}
.t-section .deco::before{background:rgba(255,255,255,.35)}
.t-cover .deco::after{content:'';position:absolute;right:150px;top:92px;width:190px;height:46px;background:rgba(255,230,109,.8);transform:rotate(7deg)}
strong{background:linear-gradient(transparent 55%,#FFE66D 55%);padding:0 2px}
.col,.st,.opt,.frame{box-shadow:5px 5px 0 var(--line)}
.col:first-child{transform:rotate(-.6deg)}.col:nth-child(2){transform:rotate(.5deg)}`,
    },
    {
      id: 'sunset', name: '夕陽活力', tags: ['課堂', '活動'], sample: 'class', tr: 'slide',
      desc: '暖橘到金黃的夕陽色，粗體大字很有精神，適合工作坊和分享會。',
      fonts: [G.sans],
      vars: { bg: '#FFF5EB', fg: '#2D1A10', muted: '#77584A', ac: '#E5521F', ac2: '#D98E00', card: '#FFFFFF', line: '#F2D7C2', edge: '#F2DECB', secBg: '#E5521F', secFg: '#FFFFFF', secAc: '#FFE0A3', hf: F.sans, bf: F.sans, hw: 900, rad: '18px' },
      css: `.t-cover,.t-end{background:linear-gradient(165deg,#FFF5EB 52%,#FFD5B0)}
.t-cover .deco::before{content:'';position:absolute;right:130px;bottom:-150px;width:430px;height:430px;border-radius:50%;background:linear-gradient(#F7AE2B,#E5521F)}
.t-cover .deco::after{content:'';position:absolute;right:130px;bottom:0;width:430px;height:140px;background:repeating-linear-gradient(#FFD5B0 0 10px,transparent 10px 28px)}
.slide:not(.t-cover):not(.t-section) .deco::before{content:'';position:absolute;right:-70px;top:-70px;width:200px;height:200px;border-radius:50%;background:linear-gradient(#F7AE2B,#E5521F);opacity:.9}
.t-section .deco::before{content:'';position:absolute;right:-120px;bottom:-200px;width:560px;height:560px;border-radius:50%;background:rgba(255,255,255,.12)}
.col,.st,.opt{box-shadow:0 10px 26px rgba(229,82,31,.1)}`,
    },
    {
      id: 'pastel', name: '粉彩手作', tags: ['活動', '課堂'], sample: 'event', tr: 'zoom',
      desc: '粉紅和薄荷綠的柔和配色、圓點和圓角卡片，活潑可愛不刺眼。',
      fonts: [G.round, G.sans],
      vars: { bg: '#FFF5F1', fg: '#3D2F42', muted: '#77667A', ac: '#D9577A', ac2: '#3E918C', card: '#FFFFFF', line: '#F1D5CF', edge: '#F4E0DA', secBg: '#FCE1E5', secFg: '#3D2F42', secAc: '#D9577A', hf: F.round, bf: F.sans, hw: 400, rad: '32px', cb: '3px' },
      css: `.deco::before{content:'';position:absolute;right:70px;top:56px;width:230px;height:150px;background-image:radial-gradient(#F4B3C1 3.2px,transparent 3.8px);background-size:22px 22px}
.deco::after{content:'';position:absolute;left:-90px;bottom:-90px;width:290px;height:290px;border-radius:50%;background:#D8EFEC}
.t-section .deco::after{background:#FFFFFF;opacity:.7}
.col,.st,.opt,.frame{border-style:dashed}
.steps .dot{border-radius:24px}`,
    },
    {
      id: 'aurora', name: '漸層光暈', tags: ['活動', '提案'], sample: 'event', tr: 'zoom',
      desc: '深色底加上紫、粉、橘的光暈漸層，標題是漸層字，吸睛有質感。',
      fonts: [G.sans],
      vars: { bg: '#0C0B1D', fg: '#FFFFFF', muted: '#BBB6D8', ac: '#FF7AB8', ac2: '#7CC7FF', card: 'rgba(255,255,255,.07)', line: 'rgba(255,255,255,.16)', edge: '#05040F', secBg: '#0C0B1D', secFg: '#FFFFFF', secAc: '#FFB36B', hf: F.sans, bf: F.sans, hw: 900, rad: '20px', cb: '1px' },
      css: `.slide{background:radial-gradient(circle at 12% 18%,rgba(130,80,255,.45),rgba(130,80,255,0) 40%),radial-gradient(circle at 88% 82%,rgba(255,90,160,.38),rgba(255,90,160,0) 42%),radial-gradient(circle at 82% 12%,rgba(255,170,80,.22),rgba(255,170,80,0) 34%),#0C0B1D}
.t-section{background:radial-gradient(circle at 70% 50%,rgba(255,122,184,.4),rgba(255,122,184,0) 50%),radial-gradient(circle at 20% 80%,rgba(124,199,255,.3),rgba(124,199,255,0) 45%),#0C0B1D}
.t-cover h1,.t-end h1,.t-section h1{background:linear-gradient(90deg,#FFFFFF 10%,#FFC0DE 55%,#FFD29A);-webkit-background-clip:text;background-clip:text;color:transparent}
.t-cover .bar{background:linear-gradient(90deg,#8B5CF6,#FF7AB8,#FFB36B)}
.steps .dot{background:linear-gradient(135deg,#8B5CF6,#FF7AB8)}
.col,.st,.opt{-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}`,
    },
    {
      id: 'bauhaus', name: '幾何色塊', tags: ['活動', '課堂'], sample: 'event', tr: 'rise',
      desc: '紅、藍、黃三原色的圓形、三角形和粗黑框，大膽又有設計感。',
      fonts: [G.sans],
      vars: { bg: '#F2EDE2', fg: '#1A1A1A', muted: '#4F4F4F', ac: '#D7263D', ac2: '#1B4DD9', card: '#FFFFFF', line: '#1A1A1A', edge: '#DED6C6', secBg: '#1B4DD9', secFg: '#FFFFFF', secAc: '#F4B400', hf: F.sans, bf: F.sans, hw: 900, rad: '0px', cb: '3px' },
      css: `.t-cover .deco::before{content:'';position:absolute;right:110px;top:90px;width:300px;height:300px;border-radius:50%;background:#F4B400}
.t-cover .deco::after{content:'';position:absolute;right:250px;bottom:0;border-left:170px solid transparent;border-right:170px solid transparent;border-bottom:300px solid #1B4DD9}
.t-cover h1{max-width:760px}
.slide:not(.t-cover):not(.t-section) .deco::before{content:'';position:absolute;right:0;top:0;width:130px;height:130px;background:#F4B400;border-radius:0 0 0 100%}
.slide:not(.t-cover):not(.t-section) .deco::after{content:'';position:absolute;right:0;bottom:0;width:60px;height:60px;background:#D7263D}
.t-section .deco::before{content:'';position:absolute;right:-100px;bottom:-100px;width:440px;height:440px;border-radius:50%;background:#F4B400}
.col,.st,.opt,.frame{box-shadow:8px 8px 0 #1A1A1A}
.st:nth-child(2) b{color:#1B4DD9}.st:nth-child(3) b{color:#B98600}
.steps .dot{border-radius:0}.bl li::before{border-radius:0}`,
    },
    {
      id: 'sage', name: '森林綠意', tags: ['報告', '衛教'], sample: 'report', tr: 'fade',
      desc: '鼠尾草綠和金色點綴，搭配明體標題，穩重自然，適合成果報告。',
      fonts: [G.serif, G.sans],
      vars: { bg: '#EEF1E8', fg: '#1E3A2F', muted: '#566B5F', ac: '#2F6B4F', ac2: '#A67C1E', card: '#F8FAF4', line: '#D1DAC8', edge: '#D6DDCD', secBg: '#1E3A2F', secFg: '#F1EEDF', secAc: '#D8B45C', hf: F.serif, bf: F.sans, hw: 700, rad: '8px' },
      css: `.deco::before{content:'';position:absolute;right:-130px;bottom:-230px;width:580px;height:580px;border-radius:50% 0 50% 0;background:#DCE5D3;transform:rotate(20deg)}
.deco::after{content:'';position:absolute;right:120px;bottom:-200px;width:300px;height:300px;border-radius:50% 0 50% 0;background:#E6ECDF;transform:rotate(-15deg)}
.t-section .deco::before{background:rgba(255,255,255,.06)}.t-section .deco::after{background:rgba(216,180,92,.12)}
.t-cover .bar{background:var(--ac2)}
.col,.st{border-top:5px solid var(--ac)}.col:nth-child(2){border-top-color:var(--ac2)}`,
    },
    {
      id: 'editorial', name: '雜誌編排', tags: ['報告', '提案'], sample: 'report', tr: 'fade',
      desc: '像雜誌內頁：粗黑明體、細線分隔、紅色色塊，正式又有個性。',
      fonts: [G.serif, G.sans, G.play],
      vars: { bg: '#F3F0E8', fg: '#141414', muted: '#55524D', ac: '#B3261E', ac2: '#141414', card: 'transparent', line: '#141414', edge: '#DCD7CB', secBg: '#141414', secFg: '#F3F0E8', secAc: '#E2574C', hf: F.serif, bf: F.sans, nf: F.play, hw: 900, ls: '-.01em', rad: '0px' },
      css: `.deco::before{content:'';position:absolute;left:104px;right:104px;top:46px;border-top:1px solid currentColor;opacity:.6}
.t-cover .deco::after{content:'';position:absolute;right:0;top:0;bottom:0;width:34%;background:#B3261E}
.t-cover h1{font-size:92px;max-width:760px}.t-cover h1.long{font-size:70px}
.frame{background:#E8E2D4}.t-cover .sub,.t-cover .meta{max-width:700px}
.t-cover .bar{height:3px;width:120px;border-radius:0;background:var(--fg)}
h2{border-bottom:1px solid var(--fg);padding-bottom:22px}
.col,.st{border-top:4px solid var(--fg);padding:28px 4px 0}
.st b{font-weight:900}
.ag li{border-bottom:1px solid var(--fg)}
.bl li::before{border-radius:0;width:24px;height:2px;top:.78em;background:var(--fg)}
.t-quote blockquote{font-family:'Noto Serif TC',serif}.qm{font-family:'Playfair Display',serif}
.steps .dot{border-radius:0;background:var(--fg);box-shadow:none}.steps::before{background:var(--fg);height:1px;top:36px}`,
    },
    {
      id: 'minimal', name: '極簡留白', tags: ['報告', '提案'], sample: 'pitch', tr: 'slide',
      desc: '大量留白、粗黑字和一個藍色重點色，簡單俐落，內容最突出。',
      fonts: [G.sans],
      vars: { bg: '#FFFFFF', fg: '#111111', muted: '#7A7A7A', ac: '#3451D1', ac2: '#111111', card: '#F5F5F5', line: '#E6E6E6', edge: '#ECECEC', secBg: '#FFFFFF', secFg: '#111111', secAc: '#3451D1', hf: F.sans, bf: F.sans, hw: 900, ls: '-.01em', rad: '0px' },
      css: `.slide{padding:96px 120px}
.t-section .num{position:absolute;right:110px;bottom:20px;font-size:300px;color:#EEF1FC;margin:0;z-index:0}
.deco::before{content:'';position:absolute;left:120px;bottom:56px;width:12px;height:12px;background:var(--ac)}
.bl li::before{border-radius:0;width:10px;height:10px;top:.62em}
.t-cover .bar{width:12px;height:12px;border-radius:0}`,
    },
    {
      id: 'midnight', name: '深夜藍金', tags: ['提案', '報告'], sample: 'pitch', tr: 'fade',
      desc: '深藍底、金色細線和柔光，像頒獎典禮一樣隆重，適合正式提案。',
      fonts: [G.serif, G.sans, G.play],
      vars: { bg: '#0E1424', fg: '#E8ECF5', muted: '#9CA6BE', ac: '#E5BE73', ac2: '#8EADF7', card: 'rgba(255,255,255,.05)', line: 'rgba(255,255,255,.13)', edge: '#070A13', secBg: '#121B33', secFg: '#E8ECF5', secAc: '#E5BE73', onAc: '#0E1424', hf: F.serif, bf: F.sans, nf: F.play, hw: 700, rad: '14px', cb: '1px' },
      css: `.slide{background:radial-gradient(ellipse 80% 60% at 85% 0%,#1D2B50 0,rgba(29,43,80,0) 60%),#0E1424}
.deco::before{content:'';position:absolute;left:104px;top:54px;width:60px;height:2px;background:var(--ac)}
.t-cover .deco::after,.t-end .deco::after{content:'';position:absolute;right:-150px;top:-150px;width:580px;height:580px;border-radius:50%;border:1px solid rgba(229,190,115,.35);box-shadow:0 0 0 70px rgba(229,190,115,.035),0 0 0 140px rgba(229,190,115,.025)}
.t-section .num{font-weight:700}`,
    },
    {
      id: 'graphite', name: '科技深灰', tags: ['提案', '報告'], sample: 'pitch', tr: 'slide',
      desc: '深灰網格底、螢光綠重點和等寬字標籤，適合科技、資料和專題提案。',
      fonts: [G.grot, G.sans, G.mono],
      vars: { bg: '#111318', fg: '#E7E9EE', muted: '#8E96A4', ac: '#3DDC97', ac2: '#4CC9F0', card: '#1A1D24', line: '#2B303B', edge: '#08090C', secBg: '#3DDC97', secFg: '#0B0D10', secAc: '#0B0D10', onAc: '#0B0D10', hf: F.grot, bf: F.sans, nf: F.grot, hw: 700, rad: '12px', cb: '1px' },
      css: `.slide{background-image:linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px);background-size:40px 40px}
.t-section{background-image:none}
.kick{font-family:'JetBrains Mono',monospace;letter-spacing:.06em}
h2::before{content:'// ';color:var(--ac);font-family:'JetBrains Mono',monospace;font-weight:500}
.t-cover .deco::after{content:'';position:absolute;right:-80px;top:50%;width:520px;height:520px;margin-top:-260px;border-radius:50%;background:radial-gradient(circle,rgba(61,220,151,.18),rgba(61,220,151,0) 65%)}
.t-cover .bar{height:4px;border-radius:0}
.steps .dot{border-radius:12px}`,
    },
    {
      id: 'campus', name: '校園活力', tags: ['課堂', '提案'], sample: 'pitch', tr: 'rise',
      desc: '靛藍配亮黃、圓角白卡片和柔和陰影，年輕明亮，適合學生報告。',
      fonts: [G.sans],
      vars: { bg: '#FFFFFF', fg: '#1C1C3A', muted: '#66668A', ac: '#5050CC', ac2: '#C98A00', card: '#FFFFFF', line: '#E4E4F5', edge: '#E8E8F6', secBg: '#5050CC', secFg: '#FFFFFF', secAc: '#FFD166', hf: F.sans, bf: F.sans, hw: 900, rad: '24px' },
      css: `.t-cover .deco::before,.t-end .deco::before{content:'';position:absolute;right:-70px;top:-70px;width:470px;height:470px;border-radius:42% 58% 55% 45%;background:#EEF0FF}
.t-cover .deco::after,.t-end .deco::after{content:'';position:absolute;right:300px;bottom:70px;width:90px;height:90px;border-radius:50%;background:#FFD166}
.t-section .deco::before{content:'';position:absolute;right:-90px;bottom:-140px;width:500px;height:500px;border-radius:45% 55% 50% 50%;background:rgba(255,255,255,.1)}
.col,.st,.opt,.frame{box-shadow:0 14px 34px rgba(80,80,204,.13);border:0}
.frame{background:#F4F4FF}
.st:nth-child(2n) b{color:var(--ac2)}`,
    },
  ];

  const TAGS = ['衛教', '長者', '課堂', '報告', '提案', '活動'];
  window.WST_DATA = { THEMES, SAMPLES, TAGS };
})();
