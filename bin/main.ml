let page_title = "Conway's Game of Life"

let page_content =
  let open Tyxml.Html in
  div
    ~a:[ a_class [ "h-screen flex flex-col" ] ]
    [ header
        ~a:[ a_class [ "flex items-center px-3 pt-2" ] ]
        [ span ~a:[ a_class [ "italic font-semibold text-3xl" ] ] [ txt page_title ] ]
    ; main
        ~a:[ a_class [ "flex flex-1 gap-x-4 gap-y-4 overflow-auto p-4" ] ]
        [ div
            ~a:
              [ a_class
                  [ "w-full bg-gray-100 border border-gray-50 rounded-lg shadow flex-1 \
                     flex flex-col"
                  ]
              ]
            [ div []
            ; div
                ~a:
                  [ a_class [ "relative flex-1 m-1 overflow-hidden" ]
                  ; a_id "canvas-wrapper"
                  ]
                [ canvas
                    ~a:
                      [ a_class [ "m-auto border border-gray-300" ]
                      ; a_height 100
                      ; a_width 100
                      ]
                    [ txt "get a new browser" ]
                ]
            ]
        ]
    ]
;;

let layout =
  let open Tyxml.Html in
  html
    (head
       (title @@ txt page_title)
       [ meta ~a:[ a_charset "utf-8" ] ()
       ; link ~rel:[ `Stylesheet ] ~href:"/static/output.css" ()
       ])
    (body
       ~a:[ a_id "body"; a_class [ "bg-gray-200 text-black font-sans" ] ]
       [ page_content
       ; script ~a:[ a_src "/static/index.js" ] @@ txt ""
         (* script ~a:[ a_src "/static/extensions.js" ] @@ txt "" *)
       ])
;;

let html_to_string html = Fmt.str "%a" (Tyxml.Html.pp ()) html

let () =
  Dream.run
  @@ Dream.logger
  @@ Dream_livereload.inject_script ()
  @@ Dream.router
       [ Dream.get "/" (fun _ -> Dream.html @@ html_to_string layout)
       ; Dream.get "/static/**" (Dream.static "./static")
       ; Dream_livereload.route ()
       ]
;;
