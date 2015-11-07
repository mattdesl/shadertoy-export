# shadertoy-export

[![stable](http://badges.github.io/stability-badges/dist/stable.svg)](http://github.com/badges/stability-badges)

A small utility for exporting ShaderToy demos to large (print-ready) PNG images. On my MacBookPro, this can export up to 10,000x10,000 px images.

It only features a small set of shaders (those set to `Public + API`) and doesn't support cube maps, video inputs, etc.

**This tool is experimental and not complete.** If you want to help maintain it, let me know.

Some examples:

![image](http://i.imgur.com/HXcu8WP.jpg?1)

A [2880x1800 wallpaper](http://i.imgur.com/F1sw16z.jpg) from [this shader](https://www.shadertoy.com/view/XtjSDK).

![two](http://i.imgur.com/F1sw16z.jpg)

## Install

Install the tool globally with npm.

```sh
npm install shadertoy-export -g
```

## Command-Line Usage

*More docs to follow.*

Basic usage, writes the first frame to process.stdout as PNG.

```sh
shadertoy-export shader.frag [opts] > image.png
```

You can use `--api` or `-a` to grab from the ShaderToy API, which loads demos that are saved as `Public + API`. For this, you need to specify a demo ID like `XslGRr`, or a URL like [https://www.shadertoy.com/view/XslGRr](https://www.shadertoy.com/view/XslGRr). Example:

```sh
shadertoy-export XslGRr --api > image.png
```

You can use `--output` or `-o` instead of writing to stdout, and `--size` to render a different resolution. You can use `--wait` to wait N milliseconds before rendering a frame.

```sh
shadertoy-export XslGRr --api --output output/1.png --size 1080,768 --wait 1500
```

#### interactive mode

You can also enter interactive (GUI) mode with the `--frame` or `-f` option. This opens a window which accepts mouse input, and you can hit `Cmd + S` or `Ctrl + S` at any point to save the image to your output path.

```sh
shadertoy-export -f --api --size=512,256 -o images/1.png XslGRr
```

![gui](http://i.imgur.com/OkEKAfI.png)

You can also specify a `--scale` or `-S` option to reduce the *interactive* resolution (does not affect output). For example, `--scale=0.5` will draw the scene at half resolution.

## License

MIT, see [LICENSE.md](http://github.com/mattdesl/shadertoy-export/blob/master/LICENSE.md) for details.
