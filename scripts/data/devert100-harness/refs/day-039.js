/**
 * @param {string[]} tokens
 * @return {number}
 */
var evalRPN = function(tokens) {
    const st = [];
    for (const t of tokens) {
        if (t === "+" || t === "-" || t === "*" || t === "/") {
            const b = st.pop(), a = st.pop();
            if (t === "+") st.push(a + b);
            else if (t === "-") st.push(a - b);
            else if (t === "*") st.push(a * b);
            else st.push(Math.trunc(a / b));
        } else {
            st.push(Number(t));
        }
    }
    return st.pop();
};
