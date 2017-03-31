package oauth2

//
// import (
// 	"net/http"
// 	"testing"
// )
//
// func TestCookieExtractor(t *testing.T) {
// 	var test = []struct {
// 		Desc     string
// 		Name     string
// 		Value    string
// 		Lookup   string
// 		Expected string
// 		Err      error
// 	}{
// 		{
// 			Desc:     "No cookie of this name",
// 			Name:     "Auth",
// 			Value:    "reallyimportant",
// 			Lookup:   "Doesntexist",
// 			Expected: "",
// 			Err:      oauth2.ErrAuthentication,
// 		},
// 		{
// 			Desc:     "Cookie token extracted",
// 			Name:     "Auth",
// 			Value:    "reallyimportant",
// 			Lookup:   "Auth",
// 			Expected: "reallyimportant",
// 			Err:      nil,
// 		},
// 	}
// 	for _, test := range test {
// 		req, _ := http.NewRequest("", "http://howdy.com", nil)
// 		req.AddCookie(&http.Cookie{
// 			Name:  test.Name,
// 			Value: test.Value,
// 		})
//
// 		var e oauth2.TokenExtractor = &oauth2.CookieExtractor{
// 			Name: test.Lookup,
// 		}
// 		actual, err := e.Extract(req)
// 		if err != test.Err {
// 			t.Errorf("Cookie extract error; expected %v  actual %v", test.Err, err)
// 		}
//
// 		if actual != test.Expected {
// 			t.Errorf("Token extract error; expected %v  actual %v", test.Expected, actual)
// 		}
// 	}
// }
