/* ============================================
   works.js — 作品データ
   ・配列の上にあるものほど先に表示されます
   ・追加／編集は portfolio.html?admin で行い、書き出した works.js で
     このファイルを置き換えるのが簡単です（手で書き足してもOK）
   ・body の書き方: ## 見出し / ### 小見出し / - 箇条書き
     ![説明](assets/img/xxx.png) / [文字](URL) / **太字** / 空行で段落
   ============================================ */
const WORKS = [
  {
    id: 'study-monster',
    title: 'スタディーモンスター',
    type: 'App',
    tags: ['Raising Sim', 'support'],
    emoji: '🦖',
    image: 'assets/img/1.png',
    summary: '学習記録と育成ゲームが一体化したアプリ。習慣の継続化をサポートします。',
    body: `## どんなアプリ？
        学習記録と育成ゲームが一体化したアプリです。勉強した記録がモンスターの成長につながるので、習慣の継続化をサポートします。

        このアプリは、日々の学習を記録しながら、自分だけのモンスターを育成できる学習サポートアプリです。勉強した時間がモンスターの成長につながるので、日々の努力が目に見える成果に変わります。
        タイマーや手動入力で手軽に学習時間を記録できるほか、目標設定やグラフによる学習分析など、勉強を継続するための機能も充実。さらに、フレンド機能を使えば、友達と学習記録を共有して、お互いに刺激を受けながら頑張れます。

        ## 主な機能
        ・学習記録：タイマーと手動入力で毎日の勉強時間を簡単に記録。
        ・モンスター育成：勉強時間に応じてモンスターが成長・進化！
        ・目標設定：毎日の学習目標を設定して、達成を目指そう。
        ・学習レポート：日別・月別のグラフで学習時間や傾向を振り返り。
        ・フレンド機能：友達と勉強時間を共有して、励まし合いながら学習。

        ## 主な機能
        ReactNative / expo /jotai / SQLite / AsyncStorage
        Firebase(firestore, authentication, function, hosting)

        ## ダウンロード
        GooglePlayストアのみで利用できます！ぜひダウンロードしてください。
        Apple Storeではまだ公開されていません。
        
        最近アプリパクられて爆萎え`,
    links: [
      { label: '公式サイトを見る', url: 'https://su-studio.com/' }
    ]
  },
  {
    id: 'oekaki',
    title: 'お絵描き掲示板',
    type: 'Web',
    tags: ['draw'],
    emoji: '🎨',
    image: 'assets/img/oekaki.png',
    summary: 'WEB上でお絵描きして、投稿できる掲示板です。',
    body: `## どんなサイト？
      WEB上でお絵描きして、そのまま投稿できる掲示板です。
      本当は、データベースを使用して投稿を保存したかったのですが、まだできておりません。
      なので、Googleフォームを使って投稿を受け取る形にしています。
      ## 使用技術
      html / CSS / JavaScript / D1（SQLite互換データベース）
    `,
    links: [
      { label: 'お絵描き掲示板を開く', url: 'oekaki.html' }
    ]
  },
  {
    id: 'piyopiyo-calc',
    title: 'RYUKOKU',
    type: 'App',
    tags: ['game'],
    image: 'assets/img/ryukoku.jpg',
    summary: '2025年の中間チーム開発で作ったネタ作品です。テーマが大学だったのでこの名前です。恋愛ギャグノベルゲームです。',
    body: `## どんな作品
      2025年の中間チーム開発で作ったネタ作品です。テーマが大学だったのでこの名前です。
      RYUKOKUという架空の大学の仏教研究会に入部したあなた（主人公）は、個性豊かな部員たちと出会い、日常会話を重ねながら、次第に心を通わせていきます。
      選んだ選択肢によって物語は分岐し、6つのエンディングにたどり着くマルチエンド型の恋愛ノベルゲームです。

      ## 使用技術
      Flet / SQLite

      ## プレイ動画
      Githubに保存してますが、多分プレイできないと思います。
      けど動画は残ってます。
      これはネタキャラの玄妙ルートです。
      全部で3人いて一番のギャグルートです。ちなみにBADEND
      ![RYUKOKUのプレイ動画](assets/img/ryukokumov.gif)

      ## スライド
      当時のスライドです。
      `,
        links: [
      { label: 'スライドを見る', url: 'https://canva.link/w1r62r8t4gtwksf' },
    ]
  },
    {
    id: 'insyu-mura',
    title: '因習村',
    type: 'App',
    tags: ['game'],
    image: 'assets/img/insyu.jpg',
    summary: '2026年の中間チーム開発で作ったギャグホラー作品です。2位🥈を受賞しました',
    body: `## どんな作品
      2026年の中間チーム開発で作ったギャグホラー作品です。2位🥈を受賞しました。
      過疎化した村を復興するために訪れた主人公は、誤って村を守る祠を壊し、謎のおじさんが現れる。
      霊を怒らせてしまったらしいプレイヤーは霊から逃げながら素材を集め、祠を発展させて霊を鎮め、村の呪いを解いていく。

      ちなみに怨霊は、[○○○○](assets/img/kurosima.png)ちゃんです。

      ## 使用技術
      Pygame / pillow

      ## プレイ動画
      Githubに保存してますが、多分学校のpcでプレイできないと思います。
      ので、動画でご視聴ください。
      ![因習村のプレイ動画](assets/img/insyumov.gif)
      プレイしたい方は教えてください。

      ## スライド
      当時のスライドです。
      `,
        links: [
      { label: 'スライドを見る', url: 'https://canva.link/ax3yrosud3l39vs' },
    ]
  },

    {
    id: 'AIvtuber',
    title: 'AIvtuber',
    type: 'App',
    tags: ['system'],
    image: 'assets/img/AIvtuber_hed.jpg',
    summary: '2026年のHDCで個人開発したyoutubeで配信をすると答えてくれるAI搭載Vtuberです。3位🥉を受賞しました',
    body: `## どんな作品
      配信でコメントするとそれに太宰治風の返しをしてくれるAIvtuberです。（声付き）
      主にGeminiAPIとYoutubeAPIを用い接続部をpythonで補って、誰かのコメントをGeminiにプロンプトとして送るという仕組みになってます。詳しくに書いてます。
      太宰治風のしゃべり方をするように指示しているので、名前は太宰ちゃんです。
      ちなみに3DモデルはVRoidstudioで自作しました。

      ## 使用技術とソフト
      Python / GeminiAPI / YoutubeAPI / VOICEVOXAPI / sounddevice / soundfile /
      OBSstudio / VOICEVOX / VRoidstudio /VMagicMirror

      ## 詳しく
      当時のスライドがあるので、そちらに詳しく書かれています。
      ちなみにyoutubeチャンネルも上げときます。（検証で使うために作ったもの）
      `,
        links: [
      { label: 'スライドを見る', url: 'https://canva.link/u549uzfnnebk5j0' },
      { label: 'Youtubeチャンネル', url: 'https://www.youtube.com/watch?v=VPbWeKH_dXE&t=7904s' },
    ]
  },

    {
    id: 'lain',
    title: 'Lainを好きになりましょう',
    type: 'App',
    tags: ['game'],
    image: 'assets/img/lain_like.png',
    summary: '2024年にはじめて作った簡単なゲーム作品です。',
    body: `## どんな作品
      lainというキャラがいて、私はその子が大好きなので、その子のゲームを作ってみた感じです。
      大した機能はなく、選択肢を間違えると少しホラー要素のあるBADENDになるだけの簡単なものです。
      初作品で、コードどこに残ってるかわからないです。
      見つかったら、WEBでできるように改造してここに張りたいですね。
      当時のスライドだけは見つかりました。

      ## 使用技術
      Python / flet

      ## スライド
      当時のスライドです。
      `,
        links: [
      { label: 'スライドを見る', url: 'https://canva.link/c3vo813vmx8ii1u' },
    ]
  },
];
