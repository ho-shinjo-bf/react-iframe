---
theme: seriph
# random image from a curated Unsplash collection by Anthony
# like them? see https://unsplash.com/collections/94734566/slidev
background: https://cover.sli.dev
# some information about your slides (markdown enabled)
title: iframeとメインページの通信
# apply unocss classes to the current slide
class: text-center
transition: slide-left

hideInToc: true
---

# iframeとメインページの通信

WebPaySE LPの開発を楽にするための技術

---
hideInToc: true
layout: image-right
image: https://cover.sli.dev
---

# Table of contents

<Toc minDepth="1" maxDepth="1"></Toc>

---

# iframeは何？

iframeは、ウェブページの中に別のウェブページを埋め込むためのHTMLタグです。

<v-click>

使い方はとても簡単：

```html
<iframe width="500" height="200" src="https://shop.basefood.co.jp/" />
```

</v-click>

<v-click>

<br />

<div style="border: solid 1px gray">
  <h2>これはベースフードのページ</h2>
  <iframe width="500" height="200" src="https://shop.basefood.co.jp/" />
</div>

Read more about [iframe](https://developer.mozilla.org/ja/docs/Web/HTML/Element/iframe)

</v-click>

---
layout: image-right
image: https://cover.sli.dev
---

# 現在の悩み

LPのデザインが来たらエンジニアは何をしなければいけませんか？

<v-click>

1. <span v-mark.circle.red="3">数千行のマークアップ</span>をVue or Reactで再現

    しかも、<span v-mark.red="4">汎用性ほぼなしのコンポーネント</span>が増えるので嬉しくない

</v-click>

<v-click>

2. jQueryなどVueとReactに使えないライブラリが使用されて、VueとReactに再現できるように、<span v-mark.circle.red="5">ライブラリ探しまたは開発が必要</span>

</v-click>

<div v-click="6">

<br />
<h2 style="text-align: center">非常に大変！！！</h2>

</div>


---

# 救世主はiframe

LPのHTMLをiframeでページの上に配置して、React側formだけ開発すれば楽じゃない？？

<v-click>

<div style="border: solid 1px gray" class="relative">
  <iframe width="500" height="200" src="https://shop.basefood.co.jp/" />

  <h3>👆はiframe</h3>
  <h2 class="bg-red-400">ここからはform</h2>
  <form>
    <label html-for="name">Name</label>
    <input class="ml-2 border-2" type="text" id="name" name="name" required />
    <br />
    <label html-for="email">Email</label>
    <input class="ml-2 border-2" type="email" id="email" name="email" required />
    <br />
    <label html-for="message">Message</label>
    <textarea class="ml-2 border-2" id="message" name="message" rows={4} required />
  </form>

  <div class="absolute top-4 right-0 color-red" v-click="2">
    <h3>問題</h3>
    <ul class="max-w-[300px]">
      <li>一体感がない</li>
      <li>購入ボタンをクリックしたら、どうフォームへ通信？</li>
    </ul>
  </div>

</div>

</v-click>

---

# 一体感の問題を解決

````md magic-move {lines: true}
```ts
// step 1
export default function Home() {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  return (
    <iframe src="/send.html" ref={iframeRef} />
  );
}
```

```ts
// step 2
const resizeIframe = (iframe: HTMLIFrameElement) => {
  if (iframe.contentWindow?.document.body.scrollHeight) {
    iframe.style.height =
      iframe.contentWindow.document.body.scrollHeight + "px";
  }
};

export default function Home() {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  return (
    <iframe src="/send.html" ref={iframeRef} />
  );
}
```

```ts {*|11|12|22|14-20|*}
// step 3
const resizeIframe = (iframe: HTMLIFrameElement) => {
  if (iframe.contentWindow?.document.body.scrollHeight) {
    iframe.style.height =
      iframe.contentWindow.document.body.scrollHeight + "px";
  }
};

export default function Home() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [mounted, setMounted] = useState(false);
  const afterIframeLoaded = resizeIframe(iframeRef.current);

  useEffect(() => {
    setMounted(true);
    window.addEventListener("resize", afterIframeLoaded);
    return () => {
      window.removeEventListener("resize", afterIframeLoaded);
    };
  }, [afterIframeLoaded, mounted]);
  
  return mounted ?  <iframe onLoad={afterIframeLoaded} src="/send.html" ref={iframeRef} />: <div>Loading...</div>;
}
```
````

---

# iframeとの通信

Window.postMessage()を使います。

<v-click>

window.postMessage() は、 Window オブジェクト間で安全にオリジン間通信を可能にするためのメソッドです。

使えるためにいくつかの条件を満たす必要があります。

</v-click>

<v-click>

1. ターゲットウィンドウの存在。→iframe中のLP。

</v-click>

<v-click>

2. 信頼できるターゲットオリジンの指定。指定したオリジンに一致しない場合、メッセージは無視されます

</v-click>

<v-click>

3. イベントリスナーの設定

    ```window.addEventListener('message', handlerFunction)```

</v-click>

---

# LP送信側

```html {*|4-5}
<script>
    function scrollToParentForm() {
        console.log("Sending message to parent window to scroll to contact form");
        // 全てのoriginに送信する
        window.parent.postMessage({ type: "scrollTo", id: "contact" }, "*");
    }
</script>
```

---

# React受信側

````md magic-move {lines: true}
```ts {*|3|7-8}
// step1
const scrollToMessage = (event: MessageEvent<{ type: string; id: string }>) => {
  if (event.origin !== window.location.origin) {
    return;
  }

  if (event.data.type === "scrollTo") {
    scroller.scrollTo(event.data.id, {
      duration: 500,
      smooth: true,
    });
  }
};
```

```ts
// 先までのソースコード
export default function Home() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [mounted, setMounted] = useState(false);
  const afterIframeLoaded = resizeIframe(iframeRef.current);

  useEffect(() => {
    setMounted(true);
    window.addEventListener("resize", afterIframeLoaded);
    return () => {
      window.removeEventListener("resize", afterIframeLoaded);
    };
  }, [afterIframeLoaded, mounted]);
  
  return mounted ?  <iframe onLoad={afterIframeLoaded} src="/send.html" ref={iframeRef} />: <div>Loading...</div>;
}
```

```ts {*|10,13}
// step2
export default function Home() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [mounted, setMounted] = useState(false);
  const afterIframeLoaded = resizeIframe(iframeRef.current);

  useEffect(() => {
    setMounted(true);
    window.addEventListener("resize", afterIframeLoaded);
    window.addEventListener("message", scrollToMessage);
    return () => {
      window.removeEventListener("resize", afterIframeLoaded);
      window.removeEventListener("message", scrollToMessage);
    };
  }, [afterIframeLoaded, mounted]);
  
  return mounted ?  <iframe onLoad={afterIframeLoaded} src="/send.html" ref={iframeRef} />: <div>Loading...</div>;
}
```
````

---

# 完成したサンプル

<h2><a target="_blank" href="https://react-iframe-form.vercel.app/send.html">iframe中のLP：https://react-iframe-form.vercel.app/send.html</a></h2>

<br />
<br />

<h2><a target="_blank" href="https://react-iframe-form.vercel.app/">完成ページ：https://react-iframe-form.vercel.app/</a></h2>

---
layout: center
class: text-center
---

# ご清聴ありがとうございました！

[ソースコードは💁へ](https://github.com/ho-shinjo-bf/react-iframe)

<PoweredBySlidev mt-10 />
