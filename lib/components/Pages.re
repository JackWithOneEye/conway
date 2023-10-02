open Tyxml;

let layout = (page_title, path) =>
  <Html.html>
    <head>
      <title> {Html.txt(page_title)} </title>
      <meta charset="utf-8" />
      <link rel="stylesheet" href="/static/output.css" />
      <script src="/static/index.js" />
    </head>
    <body class_="bg-gray-200 text-black font-sans">
      <div class_="h-screen flex flex-col">
        <header class_="flex items-center px-3 pt-2">
          <span class_="italic font-semibold text-3xl">
            {Html.txt(page_title)}
          </span>
        </header>
        <main class_="contents">
          <div _hx_get=path _hx_trigger="load" _hx_swap="outerHTML" />
        </main>
      </div>
    </body>
  </Html.html>;

module GameOfLife = CustomElements.GameOfLife;

let game = (game_seed, cell_size, cell_colour, speed) =>
  <div class_="flex flex-col flex-1 gap-x-4 gap-y-4 overflow-auto p-4">
    <form> <input id="seed-input" hidden=() value=game_seed /> </form>
    <GameOfLife cell_size cell_colour speed />
  </div>;
