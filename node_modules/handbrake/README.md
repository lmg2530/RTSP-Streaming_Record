# HandBrakeCLI wrapper

## How to use

See `index.coffee` and `example`

## Methods

* `setPath(string path)`: set handbrake path
* `setOpts(object opts)`: set handbrake arguments
* `setFlag(string key)`: set handbrake non-value arguments
* `setLong(string key, string val)`: set handbrake long-type options
* `setX264(object opts)`: set x264 options
* `execute`: execute HandBrakeCLI

## Example

### want to do...

```sh
HandBrakeCLI -f mp4 -E faac -2 -T -i hoge.mkv -o fuga.mp4
```
↓
```coffee
{HandBrake} = require 'handbrake'
hb = new HandBrake

hb.setOpts
  f: 'mp4'
  E: 'faac'
  2: ''
  T: ''
  i: 'hoge.mkv'
  o: 'fuga.mp4'

hb.execute()
```
---
```sh
HandBrakeCLI -e x264 -i hoge.mkv -o fuga.mp4 -x level=32:bframe=0:cabac=0
```
↓
```coffee
hb.setOpts
  e: 'x264'
  i: 'hoge.mkv'
  o: 'fuga.mp4'

hb.setX264
  level: 32
  bframe: 0
  cabac: 0

hb.execute()
```
