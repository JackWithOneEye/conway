module type DB = Caqti_lwt.CONNECTION

module T = Caqti_type

let list_seeds =
  let query =
    let open Caqti_request.Infix in
    (T.unit ->? T.string) "SELECT seed FROM conway WHERE id=0"
  in
  fun (module Db : DB) ->
    let open Lwt.Syntax in
    let* seeds_or_error = Db.collect_list query () in
    Caqti_lwt.or_fail seeds_or_error
;;

let save_seed =
  let query =
    let open Caqti_request.Infix in
    (T.string ->. T.unit)
      {| INSERT INTO conway (id, seed) VALUES (0, $1) 
        ON CONFLICT (id) DO UPDATE SET seed=$1 |}
  in
  fun seed (module Db : DB) ->
    let open Lwt.Syntax in
    let* unit_or_error = Db.exec query seed in
    Caqti_lwt.or_fail unit_or_error
;;
