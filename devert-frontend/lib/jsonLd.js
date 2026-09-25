// Serialises a JSON-LD object for <script type="application/ld+json"
// dangerouslySetInnerHTML={{ __html: jsonLdHtml(obj) }} />.
//
// JSON.stringify alone is NOT safe there: it leaves `<` as-is, so any stored
// string containing `</script>` (an institution name, a role title, a lesson
// heading) closes the tag and runs whatever follows as script - stored XSS on
// the page, which on campus.devert.in can reach the same-origin
// /api/auth/session/exchange and take over the viewer's account. Escaping
// < > & and the two JS line separators as \uXXXX keeps the JSON identical to
// a parser while making it impossible to break out of the script element.
//
// Every JSON-LD block on devert.in, campus.devert.in and careers.devert.in
// goes through this one function (campus and careers reach it through their
// @/* fallback - plain JS, no JSX, no class names).
export function jsonLdHtml(obj) {
  return JSON.stringify(obj)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
