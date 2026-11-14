# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: d4-reverify.spec.ts >> D4 real backend profile, stats and avatar persistence
- Location: tests/d4-reverify.spec.ts:4:1

# Error details

```
Test timeout of 180000ms exceeded.
```

# Page snapshot

```yaml
- main "MauGo" [ref=e3]:
  - generic [ref=e5]:
    - generic [ref=e6]:
      - button "Back" [active] [ref=e7] [cursor=pointer]
      - heading "My little corner" [level=1] [ref=e8]
      - button "Settings" [ref=e9] [cursor=pointer]
    - generic [ref=e10]:
      - generic [ref=e11]:
        - button "Change avatar" [ref=e12] [cursor=pointer]:
          - img "Your avatar" [ref=e13]
        - button [ref=e15] [cursor=pointer]:
          - strong [ref=e16]: Reader
        - paragraph [ref=e17]: ·
        - paragraph
      - generic [ref=e18]:
        - button "0 Following" [ref=e19] [cursor=pointer]:
          - text: "0"
          - generic [ref=e20]: Following
        - button "0 Followers" [ref=e21] [cursor=pointer]:
          - text: "0"
          - generic [ref=e22]: Followers
        - button "0 Likes" [ref=e23] [cursor=pointer]:
          - text: "0"
          - generic [ref=e24]: Likes
        - button "◷ Visitors ›" [ref=e25] [cursor=pointer]:
          - text: ◷
          - generic [ref=e26]: Visitors ›
      - generic [ref=e27]:
        - generic [ref=e28]:
          - heading "Image cards" [level=2] [ref=e29]
          - button "Profile visibility ›" [ref=e30] [cursor=pointer]:
            - text: Profile visibility
            - generic [ref=e31]: ›
        - button "＋ Upload a photo" [ref=e33] [cursor=pointer]:
          - generic [ref=e34]: ＋
          - generic [ref=e35]: Upload a photo
        - paragraph [ref=e36]: No photos uploaded yet.
        - generic [ref=e37]:
          - button "My moments ›" [ref=e38] [cursor=pointer]
          - button "A little moment" [ref=e39] [cursor=pointer]:
            - generic [aria-hidden] [ref=e40]: ＋
      - button "My letters ›" [ref=e42] [cursor=pointer]:
        - text: My letters
        - generic [ref=e43]: ›
    - navigation "Main navigation" [ref=e44]:
      - button "Home" [ref=e45] [cursor=pointer]
      - button "Messages" [ref=e46] [cursor=pointer]
      - button "Profile" [ref=e47] [cursor=pointer]
```