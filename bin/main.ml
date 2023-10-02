open Conway.Htmx

let html_to_string html = Fmt.str "%a" (Tyxml.Html.pp ()) html
let elt_to_string elt = Fmt.str "%a" (Tyxml.Html.pp_elt ()) elt
let page_title = "Conway's Game of Life"

let game_of_life =
  let open Tyxml.Html.Unsafe in
  node "game-of-life"
;;

let game =
  let open Tyxml.Html in
  game_of_life
    ~a:
      [ a_class
          [ "w-full bg-gray-100 border border-gray-50 rounded-lg shadow flex-1 flex \
             flex-col"
          ]
      ; Unsafe.int_attrib "cell-size" 30
      ; Unsafe.int_attrib "cell-colour" 0
      ; Unsafe.float_attrib "speed" 100.0
      ]
    []
;;

let page_content =
  let open Tyxml.Html in
  div
    ~a:[ a_class [ "h-screen flex flex-col" ] ]
    [ header
        ~a:[ a_class [ "flex items-center px-3 pt-2" ] ]
        [ span ~a:[ a_class [ "italic font-semibold text-3xl" ] ] [ txt page_title ] ]
    ; main
        ~a:[ a_class [ "flex flex-1 gap-x-4 gap-y-4 overflow-auto p-4" ] ]
        [ div ~a:[ hx_get "/game"; hx_trigger "load"; hx_swap "outerHTML" ] [] ]
    ]
;;

let layout content =
  let open Tyxml.Html in
  html
    (head
       (title @@ txt page_title)
       [ meta ~a:[ a_charset "utf-8" ] ()
       ; link ~rel:[ `Stylesheet ] ~href:"/static/output.css" ()
       ; script ~a:[ a_src "/static/index.js" ] @@ txt ""
       ])
    (body ~a:[ a_id "body"; a_class [ "bg-gray-200 text-black font-sans" ] ] [ content ])
;;

let () =
  Dream.run
  @@ Dream.logger
  @@ Dream_livereload.inject_script ()
  @@ Dream.router
       [ Dream.get "/" (fun _ -> Dream.html @@ html_to_string @@ layout page_content)
       ; Dream.get "/game" (fun _ -> Dream.html @@ elt_to_string game)
       ; Dream.get "/static/**" (Dream.static "./static")
       ; Dream_livereload.route ()
       ]
;;
