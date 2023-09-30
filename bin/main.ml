open Conway.Htmx

let html_to_string html = Fmt.str "%a" (Tyxml.Html.pp ()) html
let elt_to_string elt = Fmt.str "%a" (Tyxml.Html.pp_elt ()) elt
let page_title = "Conway's Game of Life"

let game =
  let open Tyxml.Html in
  div
    ~a:
      [ a_class
          [ "w-full bg-gray-100 border border-gray-50 rounded-lg shadow flex-1 flex \
             flex-col"
          ]
      ]
    [ div
        ~a:[ a_class [ "flex justify-end gap-2 p-2" ] ]
        [ div
            ~a:[ a_class [ "flex items-center gap-1 flex-1" ] ]
            [ label ~a:[ a_label_for "cell-size" ] [ txt "Cell Size" ]
            ; input
                ~a:
                  [ a_id "cell-size"
                  ; a_input_type `Range
                  ; a_input_min (`Number 1)
                  ; a_value "50"
                  ]
                ()
            ; span ~a:[ a_id "cell-size-state" ] [ txt "50" ]
            ]
        ; div
            ~a:[ a_class [ "flex items-center gap-1 flex-1" ] ]
            [ label ~a:[ a_label_for "cell-colour" ] [ txt "Cell Colour" ]
            ; input ~a:[ a_id "cell-colour"; a_input_type `Color; a_value "#000000" ] ()
            ; span ~a:[ a_id "cell-colour-state" ] [ txt "#000000" ]
            ]
        ; div
            ~a:[ a_class [ "flex items-center gap-1" ] ]
            [ label ~a:[ a_label_for "speed" ] [ txt "Speed" ]
            ; input ~a:[ a_id "speed"; a_input_type `Range ] ()
            ]
        ; button
            ~a:[ a_id "next"; a_class [ "p-1 border border-black active:bg-gray-400" ] ]
            [ txt "NEXT" ]
        ; button
            ~a:[ a_id "play"; a_class [ "p-1 border border-black active:bg-gray-400" ] ]
            [ txt "PLAY" ]
        ]
    ; div
        ~a:[ a_class [ "relative flex-1 p-1 overflow-hidden " ]; a_id "canvas-wrapper" ]
        [ canvas
            ~a:[ a_class [ "m-auto" ]; a_height 100; a_width 100 ]
            [ txt "get yourself a new browser" ]
        ]
    ]
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
       ; Dream.get "/game" (fun _ ->
           Dream.html ~headers:[ hx_trigger_after_swap, "initGame" ] (elt_to_string game))
       ; Dream.get "/static/**" (Dream.static "./static")
       ; Dream_livereload.route ()
       ]
;;
