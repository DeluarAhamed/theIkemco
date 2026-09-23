# THE IKEM CO.

**Live: https://the-ikemco.vercel.app**
**Repo: https://github.com/DeluarAhamed/theIkemco**

A 26 page custom static site. No framework, no CMS theme, no page builder.
Plain HTML, one stylesheet, two small scripts. Deploys anywhere.

## Deploying

Vercel is connected to the `main` branch of the GitHub repo. Any push to
`main` redeploys automatically. There is no build step on Vercel: the
repository holds the finished HTML, so it is served as is.

```bash
powershell -NoProfile -ExecutionPolicy Bypass -File build.ps1
git add -A
git commit -m "your message"
git push
```

`vercel.json` sets immutable caching on `/assets` and no-cache on the HTML, so
the versioned CSS and JS are served fast while page changes appear at once.

### Pointing a real domain at it

In the Vercel project, open Settings, then Domains, and add the domain. Vercel
prints the DNS records to set at your registrar. Then change one line at the
top of `build.ps1`:

```powershell
$siteUrl = 'https://theikemco.com'
```

and run the build. Every canonical tag, Open Graph URL and sitemap entry
follows from that single constant. Update the `Sitemap:` line in `robots.txt`
to match.

### Search engines are currently blocked

`robots.txt` carries `Disallow: /` and every page carries
`<meta name="robots" content="noindex, nofollow">`, because the listings,
testimonials and press links are still placeholder content. The site is fully
live and shareable; it is simply not indexed.

To open it up: replace the placeholder content listed further down, change
`robots.txt` to `Allow: /`, delete the robots meta line from
`src/_layout.html`, rebuild and push.

## Run it locally

Open `index.html` in a browser, or serve the folder:

```bash
powershell -NoProfile -ExecutionPolicy Bypass -File .preview/server.ps1
```

Then open `http://localhost:4322`.

## Edit it

**Edit `src/`, never the `.html` files in the root.** Those are generated.
After any change:

```bash
powershell -NoProfile -ExecutionPolicy Bypass -File build.ps1
```

| You want to change | Edit this |
| --- | --- |
| Header, menu, footer, overlays. Anything on every page | `src/_layout.html` |
| A specific page | `src/pages/<name>.html` |
| A neighborhood page, or add a sixth | the `$neighborhoods` table in `build.ps1` |
| A service page, or add a fifth | the `$services` table in `build.ps1` |
| Colours, type, spacing, components | `assets/css/site.css` |
| Behaviour | `assets/js/site.js` |
| The contour graphic | `assets/js/ridge.js` |

Adding a neighborhood is one row in a table. Nothing else changes, including
the menu and the footer. That is what scaleable means here.

## Animation

GSAP 3.12.5 with ScrollTrigger, loaded from cdnjs and pinned. It drives the
page opener, the scroll reveals, the image clip wipes, the headline masks, the
full bleed parallax and the counting figures.

It is progressive enhancement, not a dependency. If the CDN is blocked or slow,
`site.js` falls back to the IntersectionObserver path and the CSS transitions,
and the page behaves correctly with no GSAP at all. Everything is disabled
under `prefers-reduced-motion: reduce`.

Counters are markup driven. `data-count` carries the target, `data-prefix`,
`data-suffix` and `data-dec` shape it, and the element renders its final value
in the HTML so it is correct with no script. There is a four second failsafe on
the opener, because a page loaded in a background tab gets no animation frames
and nothing above the fold is allowed to sit invisible.

## The 26 pages

Home, Properties, Neighborhoods, Ladera Heights, View Park, Windsor Hills,
Baldwin Hills, Leimert Park, Services, Sports and Entertainment, Commercial,
Property Management, Construction Advisory, About Ikem, The Approach,
Client Films, Press, Journal, a Journal article template, Contact,
Client Portal.

## What changed in this round

**Hover states are fixed.** Every button variant now declares its own hover
pair, so text is never painted onto a ground of the same value. The old
`.btn` filled with ink and then set the label to forest green, which is why it
vanished. Variants are `.btn`, `.btn-solid`, `.btn-light`, `.btn-sm`.

**The navigation is a full screen menu.** Wordmark on the left, one clear call
to action, and Menu on the right. The menu carries all 21 pages with numbered
chapters and sub items. Client Portal is no longer a nav button. It is a small
link in the menu and the footer, and it has its own page.

**The call to action is Start a Conversation.** It sits in the header on every
page, closes every page in a full width band, and is the destination of almost
every link on the site.

**Page transitions.** A forest curtain wipes between pages, carrying the seal.
Taken from the pacing of 111w57.com. Images reveal with a clip wipe, headlines
rise out of a mask, and full bleed layers move on a slow parallax.

**Custom graphics.** `ridge.js` draws layered topographic contour lines on a
canvas from a text seed, so every page has its own reproducible ridge. It is
also the fallback behind any section whose background video is not in yet,
which is why the site already looks finished with no media at all.

## Your photography

Your eight shoot files were found in `Downloads\Brief-4118785-files` and are
now placed. The originals are untouched. Where they landed:

| Source | Now | Where it appears |
| --- | --- | --- |
| IMGL7255 | `ikem-hero.jpg` | Home hero, full bleed. Also Commercial |
| IMGL7057 | `ikem-dining.jpg` | Home, The practice. Also Residential Advisory |
| IMGL7448 | `ikem-agave.jpg` | Home quote break. Also the Neighborhoods break |
| IMGL7319 | `ikem-stairs.jpg` | About break. Also Property Management |
| IMGL7455 | `ikem-terrace.jpg` | The Approach and Contact breaks |
| IMGL7334 | `ikem-window.jpg` | About opening portrait |
| IMGL7304 | `ikem-headshot-01.jpg` | Contact sheet. Also Sports and Entertainment |
| IMGL7444 | `ikem-headshot-03.jpg` | Contact sheet, menu panel, Construction Advisory |

The real wordmark is in too, in two inks generated from your green PNG.
`logo-cream.png` sits over photography, `logo-green.png` takes over the moment
the bar turns to limestone, and `favicon.png` is the browser tab icon.

### Slots still waiting, and what they draw instead

Properties, neighborhoods, the journal and the client film posters have no
photography yet. Rather than leave them blank, `ridge.js` now fills any frame
whose image file is missing:

- **Property and neighborhood cards** draw an abstract architectural elevation.
  Volumes, glazing lines, a cantilever, a ground line and piers, all hairline,
  all seeded from the file path so a given card always looks the same
- **Everything else** draws contours

The drawing disappears the instant a real photograph lands at that path. No
markup change, no build step. Drop the file in and it is gone.

Send property shots, neighborhood shots and the client photos and they go in
the same way. Filenames are listed in `assets/img/_DROP-IMAGES-HERE.txt`.

### Video

Background loops and client films are still to come. Filenames and specs are in
`assets/video/_DROP-VIDEO-HERE.txt`. Every slot already carries the matching
photograph as its poster frame, so the sections look finished now and upgrade
to motion the moment you drop an mp4 in.

## Placeholder content to replace before launch

- Property addresses, prices, bed and bath counts, statuses
- Neighborhood market figures and past sale lists
- Client names, roles and runtimes on the film cards
- Press headlines and article links
- Journal titles and the sample article
- `hello@theikemco.com` and `310.555.0137`
- The footer licensing line. Confirm the exact wording your compliance
  requires, plus your DRE number

Visible notes already tell a viewer that listing data and market figures are
placeholders. Delete those lines once the real data is in.

## Wiring the forms

Every form validates, confirms and clears. Nothing is sent anywhere yet. In
`assets/js/site.js`, find the `data-form` block and post to your endpoint. The
kinds are `contact`, `list`, `report` and `portal`, so one endpoint can route
all four. On Netlify, adding `netlify` and `name` attributes to each `<form>`
is enough on its own.

## Performance and accessibility

- No framework, no build step at runtime. Three files beyond the HTML
- Google Fonts is the only third party request, with preconnect and real
  fallback stacks
- The contour canvas animates at 25fps, only while it is on screen, and
  renders a single static frame under reduced motion
- Background video is `preload="none"` except the hero, so nothing downloads
  until it is needed
- All animation is disabled under `prefers-reduced-motion: reduce`
- Without JavaScript the page still renders complete
- Focus states are visible, the menu and overlays close on Escape and return
  focus, every image carries alt text

## Before you go live

1. Buy the domain and add canonical tags
2. Add a favicon and an Open Graph image
3. Add analytics
4. Confirm the licensing and fair housing language
5. Replace the placeholder content above
6. Delete `.preview/` and `.claude/`, which are local tooling
