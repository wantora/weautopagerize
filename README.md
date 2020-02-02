# weAutoPagerize

Automatically inserts the next page.

## AutoPagerize API Reference

### SITEINFO

```js
[
  {
    url: string(regexp),
    nextLink: string(xpath),
    pageElement: string(xpath),
    insertBefore: string(xpath) | null
  },

  // sample
  {
    url: '^https://blog\\.mozilla\\.org/futurereleases/(page/\\d+/)?$',
    nextLink: '//li[@class="prev"]//a',
    pageElement: '//article',
    insertBefore: '//nav[@class="nav-paging"]',
    exampleUrl: 'https://blog.mozilla.org/futurereleases/',
  },
]
```

### HTML Classes

#### autopagerize_page_element

#### autopagerize_insert_before

#### autopagerize_page_separator, autopagerize_page_info, autopagerize_link

```html
<hr class="autopagerize_page_separator">
<p class="autopagerize_page_info">
  page: <a class="autopagerize_link" href="http://www.example.com/?page=2">2</a>
</p>
```

### Events

#### GM_AutoPagerizeLoaded

#### GM_AutoPagerizeNextPageLoaded

#### AutoPagerize_DOMNodeInserted

```js
document.addEventListener("AutoPagerize_DOMNodeInserted", function(event) {
  console.log("pageElement: ", event.target);
  console.log("parentNode: ", event.relatedNode);
  console.log("url: ", event.newValue);
}, false);
```

#### AutoPagerizeToggleRequest, AutoPagerizeEnableRequest, AutoPagerizeDisableRequest

```js
document.dispatchEvent(new Event("AutoPagerizeToggleRequest"));
```

#### AutoPagerize_launchAutoPager

```js
document.dispatchEvent(new CustomEvent("AutoPagerize_launchAutoPager", {detail: {
  siteinfo: [
    {
      url: '^https://blog\\.mozilla\\.org/futurereleases/(page/\\d+/)?$',
      nextLink: '//li[@class="prev"]//a',
      pageElement: '//article',
      insertBefore: '//nav[@class="nav-paging"]',
    },
  ],
}}));
```

#### AutoPagerizeResponseFilterRequest, AutoPagerizeResponseFilterResponse

See [src/userscript/naver-matome.js](src/userscript/naver-matome.js).

#### AutoPagerizeUserFetchRequest, AutoPagerizeUserFetchResponse

See [src/userscript/pixiv.js](src/userscript/pixiv.js).

### Compatibility table

| Name                               | weAutoPagerize | [AutoPagerize (userscript)](https://github.com/swdyh/autopagerize) | [AutoPagerize](https://github.com/swdyh/autopagerize_for_chrome) | [uAutoPagerize](https://addons.mozilla.org/firefox/addon/uautopagerize/) |
| ---------------------------------- |:---:|:---:|:---:|:---:|
| HTML Classes                       | ✔  | ✔  | ✔  | ✔  |
| SITEINFO                           | ✔  | ✔  | ✔  | ✔  |
| SITEINFO options.useUserFetch      | ✔  |     |     |     |
| SITEINFO options.useResponseFilter | ✔  |     |     |     |
| GM_AutoPagerizeLoaded              | ✔  | ✔  | ✔  | ✔  |
| GM_AutoPagerizeNextPageLoaded      | ✔  | ✔  | ✔  | ✔  |
| AutoPagerize_DOMNodeInserted       | ✔  | ✔  | ✔  | ✔  |
| AutoPagerizeToggleRequest          | ✔  | ✔  | ✔  | ✔  |
| AutoPagerizeEnableRequest          | ✔  |     | ✔  | ✔  |
| AutoPagerizeDisableRequest         | ✔  |     | ✔  | ✔  |
| AutoPagerize_launchAutoPager       | ✔  |     |     | ✔  |
| AutoPagerizeResponseFilterRequest  | ✔  |     |     |     |
| AutoPagerizeResponseFilterResponse | ✔  |     |     |     |
| AutoPagerizeUserFetchRequest       | ✔  |     |     |     |
| AutoPagerizeUserFetchResponse      | ✔  |     |     |     |
| AutoPagerizeUpdateIconRequest      |     | ✔  |     |     |
| AutoPagerizeUpdateSettingsRequest  |     |     | ✔  |     |
| uAutoPagerize_Launched             |     |     |     |     |
| uAutoPagerize_StateChange          |     |     |     | ✔  |
| uAutoPagerize_Destroy              |     |     |     | ✔  |
| uAutoPagerize_RequestLoad          |     |     |     | ✔  |
| uAutoPagerize_RequestError         |     |     |     | ✔  |
| uAutoPagerize_Request              |     |     |     | ✔  |
| uAutoPagerize_Restart              |     |     |     | ✔  |

* [AutoPagerize (userscript)](https://github.com/swdyh/autopagerize) 0.0.66
* [AutoPagerize](https://github.com/swdyh/autopagerize_for_chrome) 0.3.9
* [uAutoPagerize](https://addons.mozilla.org/firefox/addon/uautopagerize/) 0.1.4.1

## Build instructions

```
git clone https://github.com/wantora/weautopagerize.git
cd weautopagerize
npm install
npm run build
```

## Contributors

* [@yfdyh000](https://github.com/yfdyh000)
* [@Mr-Update](https://github.com/Mr-Update)
