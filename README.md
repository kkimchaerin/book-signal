```
book-signal
├─ .babelrc
├─ .git
│  ├─ COMMIT_EDITMSG
│  ├─ config
│  ├─ description
│  ├─ FETCH_HEAD
│  ├─ HEAD
│  ├─ hooks
│  ├─ index
│  ├─ info
│  │  └─ exclude
│  ├─ objects
│  │  ├─ info
│  │  └─ pack
│  ├─ ORIG_HEAD
│  ├─ packed-refs
│  └─ refs
│     ├─ heads
│     ├─ remotes
│     │  └─ origin
│     ├─ stash
│     └─ tags
├─ .gitignore
├─ LICENSE
├─ package-lock.json
├─ package.json
├─ pnpm-lock.yaml
├─ public
│  ├─ book_cover_sample.jpg
│  ├─ book_file
│  ├─ css
│  │  └─ global.css
│  ├─ dalle
│  ├─ favicon.ico
│  ├─ favicons
│  ├─ files
│  ├─ images
│  ├─ img
│  ├─ index.html
│  ├─ logo192.png
│  ├─ logo512.png
│  ├─ manifest.json
│  ├─ robots.txt
│  ├─ sample.pdf
│  └─ uploads
├─ README.md
├─ requirements.txt
├─ server
│  ├─ recommendation_system.py
│  ├─ server.py
│  └─ __pycache__
│     └─ recommendation_system.cpython-312.pyc
├─ src
│  ├─ App.css
│  ├─ App.js
│  ├─ App.test.js
│  ├─ components
│  │  ├─ book
│  │  │  ├─ CalibrationButton.jsx
│  │  │  └─ RankingBookInfo.jsx
│  │  ├─ Bookmark
│  │  │  └─ BookmarkWrapper.tsx
│  │  ├─ common
│  │  │  ├─ Header.jsx
│  │  │  └─ Search.jsx
│  │  ├─ commons
│  │  │  ├─ Snackbar.tsx
│  │  │  └─ ViewerWrapper.tsx
│  │  ├─ contextMenu
│  │  │  ├─ ColorItem.tsx
│  │  │  ├─ Item.tsx
│  │  │  └─ Wrapper.tsx
│  │  ├─ Epubjs.jsx
│  │  ├─ ErrorPopup.jsx
│  │  ├─ FindIdPopup.jsx
│  │  ├─ FontSetting
│  │  │  └─ FontSettingsWrapper.tsx
│  │  ├─ footer
│  │  │  ├─ Item.tsx
│  │  │  ├─ MoveBtn.tsx
│  │  │  └─ Wrapper.tsx
│  │  ├─ header
│  │  │  ├─ ControlBtn.tsx
│  │  │  ├─ Layout.tsx
│  │  │  ├─ Logo.tsx
│  │  │  ├─ VerticalLine.tsx
│  │  │  └─ Wrapper.tsx
│  │  ├─ JoinPopup.jsx
│  │  ├─ Merge.jsx
│  │  ├─ Modal.jsx
│  │  ├─ nav
│  │  │  ├─ BookInfo.tsx
│  │  │  └─ NavItem.tsx
│  │  ├─ NewPwPopup.jsx
│  │  ├─ note
│  │  │  ├─ highlight
│  │  │  │  ├─ Post.tsx
│  │  │  │  ├─ Title.tsx
│  │  │  │  └─ Wrapper.tsx
│  │  │  └─ Layout.tsx
│  │  ├─ option
│  │  │  ├─ Dropdown.tsx
│  │  │  ├─ DropdownItem.tsx
│  │  │  ├─ DropdownItemWrapper.tsx
│  │  │  ├─ DropdownValue.tsx
│  │  │  ├─ Layout.tsx
│  │  │  ├─ OptionTitle.tsx
│  │  │  ├─ OptionValue.tsx
│  │  │  ├─ OptionWrapper.tsx
│  │  │  ├─ Slider.tsx
│  │  │  └─ SliderValue.tsx
│  │  ├─ Reader.jsx
│  │  ├─ Recommendation.jsx
│  │  ├─ sideMenu
│  │  │  ├─ CloseBtn.tsx
│  │  │  ├─ MenuEmpty.tsx
│  │  │  └─ Wrapper.tsx
│  │  ├─ SlideShow.jsx
│  │  ├─ SummarizePage.jsx
│  │  ├─ test.jsx
│  │  └─ tts
│  │     ├─ TTSManager.tsx
│  │     ├─ TTSRateControl.tsx
│  │     ├─ TTSSettings.tsx
│  │     ├─ TTSToggle.tsx
│  │     ├─ TTSVoiceControl.tsx
│  │     └─ TTSWrapper.tsx
│  ├─ config
│  │  └─ database.js
│  ├─ containers
│  │  ├─ commons
│  │  │  ├─ ContextMenu.tsx
│  │  │  └─ Snackbar.tsx
│  │  ├─ Footer.tsx
│  │  ├─ Header.tsx
│  │  ├─ menu
│  │  │  ├─ commons
│  │  │  │  └─ Highlight.tsx
│  │  │  ├─ Nav.tsx
│  │  │  ├─ Note.tsx
│  │  │  └─ Option.tsx
│  │  └─ Reader.tsx
│  ├─ controllers
│  │  ├─ commons
│  │  │  ├─ ContextMenu.tsx
│  │  │  └─ Snackbar.tsx
│  │  ├─ Footer.tsx
│  │  ├─ Header.tsx
│  │  ├─ menu
│  │  │  ├─ commons
│  │  │  │  └─ Highlight.tsx
│  │  │  ├─ Nav.tsx
│  │  │  ├─ Note.tsx
│  │  │  └─ Option.tsx
│  │  ├─ Reader.tsx
│  │  ├─ review.js
│  │  ├─ search.js
│  │  ├─ summary
│  │  │  └─ summaryController.js
│  │  └─ user.js
│  ├─ css
│  │  ├─ bookDetail.css
│  │  ├─ deleteuser.css
│  │  ├─ findid.css
│  │  ├─ findpw.css
│  │  ├─ fonts.css
│  │  ├─ getreview.css
│  │  ├─ index.css
│  │  ├─ join.css
│  │  ├─ login.css
│  │  ├─ main.css
│  │  ├─ modal.css
│  │  ├─ mylib.css
│  │  ├─ mypage.css
│  │  ├─ newpw.css
│  │  ├─ popup.css
│  │  ├─ ReaderHeader.css
│  │  ├─ sameBook.css
│  │  └─ searchreport.css
│  ├─ data
│  │  └─ slides.js
│  ├─ index.js
│  ├─ index.tsx
│  ├─ LoadingView.tsx
│  ├─ logo.svg
│  ├─ models
│  │  ├─ bookDB.js
│  │  ├─ reviewDB.js
│  │  └─ userDB.js
│  ├─ pages
│  │  ├─ BookDetail.jsx
│  │  ├─ BookViewer.jsx
│  │  ├─ BookViewPDF.jsx
│  │  ├─ DeleteUser.jsx
│  │  ├─ ErrorBoundary.jsx
│  │  ├─ EyeGaze.jsx
│  │  ├─ FindId.jsx
│  │  ├─ FindPw.jsx
│  │  ├─ GetReview.jsx
│  │  ├─ Home.jsx
│  │  ├─ Join.jsx
│  │  ├─ Login.jsx
│  │  ├─ MyLib.jsx
│  │  ├─ MyPage.jsx
│  │  ├─ NewPw.jsx
│  │  ├─ RankingBookList.jsx
│  │  ├─ RootLayout.jsx
│  │  ├─ searchReport.jsx
│  │  └─ UploadEpub.jsx
│  ├─ react-app-env.d.ts
│  ├─ reportWebVitals.js
│  ├─ routes
│  │  ├─ bookRoutes.js
│  │  ├─ gazeRoutes.js
│  │  ├─ mainRoutes.js
│  │  ├─ rankingRoutes.js
│  │  ├─ reviewRoutes.js
│  │  ├─ sameBookRoutes.js
│  │  ├─ searchRoutes.js
│  │  ├─ userRoutes.js
│  │  └─ wishListRoutes.js
│  ├─ server.js
│  ├─ setupProxy.js
│  ├─ setupTests.js
│  ├─ setupTests.ts
│  ├─ slices
│  │  ├─ book.ts
│  │  ├─ index.ts
│  │  └─ snackbar.ts
│  ├─ tts.js
│  ├─ types
│  │  ├─ book.ts
│  │  ├─ highlight.ts
│  │  ├─ index.d.ts
│  │  ├─ loc.ts
│  │  ├─ page.ts
│  │  ├─ selection.ts
│  │  ├─ snackbar.ts
│  │  ├─ toc.ts
│  │  └─ viewerLayout.ts
│  └─ utils
│     ├─ alertMessage.js
│     ├─ api.js
│     ├─ gaze.js
│     └─ showGaze.js
├─ tailwind.config.js
├─ tsconfig.json
└─ webpack.config.js

```
