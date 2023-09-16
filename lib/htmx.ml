open Tyxml.Html.Unsafe

(* attributes *)
let hx_get get = string_attrib "hx-get" get
let hx_trigger trigger = string_attrib "hx-trigger" trigger
let hx_swap swap = string_attrib "hx-swap" swap

(* headers *)
let hx_trigger_after_swap = "HX-Trigger-After-Swap"
