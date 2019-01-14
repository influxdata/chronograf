package semantictest

import (
	"regexp"

	"github.com/google/go-cmp/cmp"
	"github.com/google/go-cmp/cmp/cmpopts"
	"github.com/influxdata/flux/semantic"
)

var CmpOptions = []cmp.Option{
	cmp.Comparer(func(x, y *regexp.Regexp) bool { return x.String() == y.String() }),

	cmpopts.IgnoreUnexported(semantic.ArrayExpression{}),
	cmpopts.IgnoreUnexported(semantic.Program{}),
	cmpopts.IgnoreUnexported(semantic.PackageClause{}),
	cmpopts.IgnoreUnexported(semantic.ImportDeclaration{}),
	cmpopts.IgnoreUnexported(semantic.Block{}),
	cmpopts.IgnoreUnexported(semantic.OptionStatement{}),
	cmpopts.IgnoreUnexported(semantic.ExpressionStatement{}),
	cmpopts.IgnoreUnexported(semantic.ReturnStatement{}),
	cmpopts.IgnoreUnexported(semantic.NativeVariableAssignment{}),
	cmpopts.IgnoreUnexported(semantic.Extern{}),
	cmpopts.IgnoreUnexported(semantic.ExternalVariableAssignment{}),
	cmpopts.IgnoreUnexported(semantic.ArrayExpression{}),
	cmpopts.IgnoreUnexported(semantic.FunctionExpression{}),
	cmpopts.IgnoreUnexported(semantic.FunctionBlock{}),
	cmpopts.IgnoreUnexported(semantic.FunctionParameters{}),
	cmpopts.IgnoreUnexported(semantic.FunctionParameter{}),
	cmpopts.IgnoreUnexported(semantic.BinaryExpression{}),
	cmpopts.IgnoreUnexported(semantic.CallExpression{}),
	cmpopts.IgnoreUnexported(semantic.ConditionalExpression{}),
	cmpopts.IgnoreUnexported(semantic.LogicalExpression{}),
	cmpopts.IgnoreUnexported(semantic.MemberExpression{}),
	cmpopts.IgnoreUnexported(semantic.IndexExpression{}),
	cmpopts.IgnoreUnexported(semantic.ObjectExpression{}),
	cmpopts.IgnoreUnexported(semantic.UnaryExpression{}),
	cmpopts.IgnoreUnexported(semantic.Property{}),
	cmpopts.IgnoreUnexported(semantic.IdentifierExpression{}),
	cmpopts.IgnoreUnexported(semantic.Identifier{}),
	cmpopts.IgnoreUnexported(semantic.BooleanLiteral{}),
	cmpopts.IgnoreUnexported(semantic.DateTimeLiteral{}),
	cmpopts.IgnoreUnexported(semantic.DurationLiteral{}),
	cmpopts.IgnoreUnexported(semantic.IntegerLiteral{}),
	cmpopts.IgnoreUnexported(semantic.FloatLiteral{}),
	cmpopts.IgnoreUnexported(semantic.RegexpLiteral{}),
	cmpopts.IgnoreUnexported(semantic.StringLiteral{}),
	cmpopts.IgnoreUnexported(semantic.UnsignedIntegerLiteral{}),
}
