# Load test

How many visitors one instance of BeeSaber serves, measured with
[k6](https://k6.io). `site.js` describes the visitors; `run-in-azure.sh` runs
them from inside Azure.

## What the visitors do

Each virtual visitor opens the start page, as a browser does: with
`Accept-Encoding: br, gzip`, and with the script and stylesheet on the
first visit only, since a browser keeps those for good. One visit in ten
asks the API which ways to sign in exist. Then the visitor reads for a
second and comes back. The number of visitors goes up in steps, 50, 100,
200 and 400, each held for a minute.

The routes that need a session are not part of it. Production has no test
accounts, on purpose.

All visitors come from one address, so the API's limit of 60 requests a
minute per address on its open routes refuses most of their API requests
with 429. `site.js` counts those as `rate_limited` instead of failing them:
that is the limit doing its job.

## Running it

```sh
bash loadtest/run-in-azure.sh
```

It creates a Container Apps job in the app's environment with 2 cores and
4 GB, runs `site.js` there, prints k6's summary and deletes the job. It
costs a few cents, or nothing within Container Apps' free monthly grant.
The test reaches the app the way visitors do, through `https://beesaber.de`.

To try the script on your own machine with one visitor:

```sh
docker run --rm -i grafana/k6@sha256:9bd01d6941fca969cb61bb57d2da5ee9b385fe2aa8881df3798c196564d6ace6 \
  run --vus 1 --iterations 2 - < loadtest/site.js
```

A full run from a laptop measures the laptop: a first attempt from home,
through a VPN and Docker Desktop's network, broke down at 25 Mbit/s with a
quarter of the requests failing, while the app's CPU stayed at 22 %.

## Results

2026-10-25, one instance with 0.25 cores and 0.5 GB, cost saving off, the
files compressed with Brotli:

| Visitors | Requests per second | App's CPU | Average answer |
| -------- | ------------------- | --------- | -------------- |
| 50       | 37                  | 47 %      | 18 ms          |
| 100      | 64                  | 51 %      | 253 ms         |
| 200      | 107                 | 66 %      | 0.7 s          |
| 400      | 134                 | 96 %      | 2.3 s          |

Over the whole run: 33,292 requests, none failed, no restart, memory at
15 % at most. The availability tests from Paris and Amsterdam, which ran
during it, got their answers in 36 to 112 ms.

What it means:

- **The limit is the quarter core.** Node handles one request at a time on
  one core, and here it has a quarter of one. Up to about 60 requests a
  second the answers stay fast; from there they queue, and at about 130
  the core is full.
- **Nothing breaks under too much load.** The answers get slow, not wrong:
  no errors, no restarts, no memory growth.
- **In visitors.** A test visitor opens a page every second. A real one
  reads for much longer between clicks, so 100 test visitors stand for
  many more real ones. The signed-in pages also ask the database and are
  not measured here.
- **More of it** would come from more cores for the one instance
  (`cpu` in `infra/containerapps.tf`), or from a CDN in front of the files.
  More instances would not, as long as the app runs as one instance; see
  "One instance" in the main README.
