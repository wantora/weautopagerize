# weAutoPagerize

Automatically inserts the next page.

## Reference

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
    url: '^https://blog\\.mozilla\\.org/futurereleases/(page/\d+/)?$',
    nextLink: '//li[@class="prev"]//a',
    pageElement: '//article',
    insertBefore: '//nav[@class="nav-paging"]',
    exampleUrl: 'https://blog.mozilla.org/futurereleases/',
  },
]
```

### Separator elements

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
