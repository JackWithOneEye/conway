open Base
open Conway.Htmx
open Components

let html_to_string html = Fmt.str "%a" (Tyxml.Html.pp ()) html
let elt_to_string elt = Fmt.str "%a" (Tyxml.Html.pp_elt ()) elt

let rec int_list_to_hex list =
  match list with
  | [] -> ""
  | [ last ] -> Fmt.str "%x" last
  | head :: tail -> Fmt.str "%x%s%s" head "," (int_list_to_hex tail)
;;

let game_seed =
  let open Int in
  let list =
    [ shift_left 11 16 lor 8
    ; shift_left 255 16
    ; shift_left 12 16 lor 9
    ; 255
    ; shift_left 10 16 lor 10
    ; 255
    ; shift_left 11 16 lor 10
    ; 255
    ; shift_left 12 16 lor 10
    ; shift_left 255 8
    ]
  in
  int_list_to_hex list
;;

let () =
  Dream.run
  @@ Dream.logger
  @@ Dream_livereload.inject_script ()
  @@ Dream.sql_pool "sqlite3:~/.conway/db.sqlite"
  @@ Dream.router
       [ Dream.get "/" (fun _ ->
           Dream.html @@ html_to_string @@ Pages.layout "Conway's Game of Life" "/game")
       ; Dream.get "/game" (fun _ ->
           Dream.html
             ~headers:[ hx_trigger_after_swap, "initGame" ]
             (elt_to_string @@ Pages.game game_seed 30 0 100.0))
       ; Dream.get "/static/**" (Dream.static "./static")
       ; Dream_livereload.route ()
       ]
;;
