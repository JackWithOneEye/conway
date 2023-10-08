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
    <form
      id="game-form"
      _hx_post="/game"
      _hx_select="#game-form"
      _hx_swap="outerHTML">
      <input id="seed-input" name="seed" hidden=() value=game_seed />
      <button
        class_="p-1 border border-black active:bg-gray-400 disabled:text-gray-400 disabled:border-gray-400">
        "SAVE"
      </button>
    </form>
    <GameOfLife cell_size cell_colour speed />
  </div>;
