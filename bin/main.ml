open Base
open Components
open Conway

let html_to_string html = Fmt.str "%a" (Tyxml.Html.pp ()) html
let elt_to_string elt = Fmt.str "%a" (Tyxml.Html.pp_elt ()) elt

let first_or_empty list =
  match list with
  | [] -> ""
  | first :: _ -> first
;;

let get_game request =
  let open Lwt.Syntax in
  let* game_seed = Dream.sql request Database.list_seeds in
  Pages.game (first_or_empty game_seed) 30 0 100.0
  |> elt_to_string
  |> Dream.html ~headers:[ "HX-Trigger-After-Swap", "initGame" ]
;;

let post_game request =
  let open Lwt.Syntax in
  let* form_data = Dream.form ~csrf:false request in
  match form_data with
  | `Ok [ ("seed", seed) ] ->
    let* () = Dream.sql request @@ Database.save_seed seed in
    Dream.redirect request "/game"
  | _ -> Dream.empty `Bad_Request
;;

let db_file = Unix.getenv "HOME" |> Fmt.str "sqlite3:%s/.conway/db.sqlite"

let secure_context_headers (inner_handler : Dream.handler) request =
  let open Lwt.Syntax in
  let+ response = inner_handler request in
  Dream.add_header response "Cross-Origin-Opener-Policy" "same-origin";
  Dream.add_header response "Cross-Origin-Embedder-Policy" "require-corp";
  response
;;

let () =
  Dream.run
  @@ Dream.logger
  @@ Dream_livereload.inject_script ()
  @@ Dream.sql_pool db_file
  @@ secure_context_headers
  @@ Dream.router
       [ Dream.get "/" (fun _ -> Pages.layout "/game" |> html_to_string |> Dream.html)
       ; Dream.get "/game" get_game
       ; Dream.post "/game" post_game
       ; Dream.get "/static/**" @@ Dream.static "./static"
       ; Dream_livereload.route ()
       ]
;;
