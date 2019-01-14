package scanner

//go:generate ruby unicode2ragel.rb -e utf8 -o unicode.rl
//go:generate ragel -I. -Z scanner.rl -o scanner.gen.go
//go:generate sh -c "go fmt scanner.gen.go > /dev/null"
