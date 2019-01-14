package semantic

import (
	"encoding/json"
	"errors"
	"fmt"
	"regexp"
	"strconv"
	"time"
)

func (p *Program) MarshalJSON() ([]byte, error) {
	type Alias Program
	raw := struct {
		Type string `json:"type"`
		*Alias
	}{
		Type:  p.NodeType(),
		Alias: (*Alias)(p),
	}
	return json.Marshal(raw)
}
func (p *Program) UnmarshalJSON(data []byte) error {
	type Alias Program
	raw := struct {
		*Alias
		Body []json.RawMessage `json:"body"`
	}{}
	if err := json.Unmarshal(data, &raw); err != nil {
		return err
	}
	if raw.Alias != nil {
		*p = *(*Program)(raw.Alias)
	}

	p.Body = make([]Statement, len(raw.Body))
	for i, r := range raw.Body {
		s, err := unmarshalStatement(r)
		if err != nil {
			return err
		}
		p.Body[i] = s
	}
	return nil
}
func (p *PackageClause) MarshalJSON() ([]byte, error) {
	type Alias PackageClause
	raw := struct {
		Type string `json:"type"`
		*Alias
	}{
		Type:  p.NodeType(),
		Alias: (*Alias)(p),
	}
	return json.Marshal(raw)
}
func (p *ImportDeclaration) MarshalJSON() ([]byte, error) {
	type Alias ImportDeclaration
	raw := struct {
		Type string `json:"type"`
		*Alias
	}{
		Type:  p.NodeType(),
		Alias: (*Alias)(p),
	}
	return json.Marshal(raw)
}
func (e *Extern) MarshalJSON() ([]byte, error) {
	type Alias Extern
	raw := struct {
		Type string `json:"type"`
		*Alias
	}{
		Type:  e.NodeType(),
		Alias: (*Alias)(e),
	}
	return json.Marshal(raw)
}
func (e *ExternBlock) MarshalJSON() ([]byte, error) {
	type Alias ExternBlock
	raw := struct {
		Type string `json:"type"`
		*Alias
	}{
		Type:  e.NodeType(),
		Alias: (*Alias)(e),
	}
	return json.Marshal(raw)
}
func (e *ExternBlock) UnmarshalJSON(data []byte) error {
	type Alias ExternBlock
	raw := struct {
		*Alias
		Node json.RawMessage `json:"node"`
	}{}
	if err := json.Unmarshal(data, &raw); err != nil {
		return err
	}
	if raw.Alias != nil {
		*e = *(*ExternBlock)(raw.Alias)
	}

	n, err := unmarshalNode(raw.Node)
	if err != nil {
		return err
	}
	e.Node = n
	return nil
}
func (s *Block) MarshalJSON() ([]byte, error) {
	type Alias Block
	raw := struct {
		Type string `json:"type"`
		*Alias
	}{
		Type:  s.NodeType(),
		Alias: (*Alias)(s),
	}
	return json.Marshal(raw)
}
func (s *Block) UnmarshalJSON(data []byte) error {
	type Alias Block
	raw := struct {
		*Alias
		Body []json.RawMessage `json:"body"`
	}{}
	if err := json.Unmarshal(data, &raw); err != nil {
		return err
	}
	if raw.Alias != nil {
		*s = *(*Block)(raw.Alias)
	}

	s.Body = make([]Statement, len(raw.Body))
	for i, r := range raw.Body {
		stmt, err := unmarshalStatement(r)
		if err != nil {
			return err
		}
		s.Body[i] = stmt
	}
	return nil
}
func (s *OptionStatement) MarshalJSON() ([]byte, error) {
	type Alias OptionStatement
	raw := struct {
		Type string `json:"type"`
		*Alias
	}{
		Type:  s.NodeType(),
		Alias: (*Alias)(s),
	}
	return json.Marshal(raw)
}
func (s *OptionStatement) UnmarshalJSON(data []byte) error {
	type Alias OptionStatement
	raw := struct {
		*Alias
		Assignment json.RawMessage `json:"assignment"`
	}{}
	if err := json.Unmarshal(data, &raw); err != nil {
		return err
	}
	if raw.Alias != nil {
		*s = *(*OptionStatement)(raw.Alias)
	}

	e, err := unmarshalVariableAssignment(raw.Assignment)
	if err != nil {
		return err
	}
	s.Assignment = e
	return nil
}
func (s *ExpressionStatement) MarshalJSON() ([]byte, error) {
	type Alias ExpressionStatement
	raw := struct {
		Type string `json:"type"`
		*Alias
	}{
		Type:  s.NodeType(),
		Alias: (*Alias)(s),
	}
	return json.Marshal(raw)
}
func (s *ExpressionStatement) UnmarshalJSON(data []byte) error {
	type Alias ExpressionStatement
	raw := struct {
		*Alias
		Expression json.RawMessage `json:"expression"`
	}{}
	if err := json.Unmarshal(data, &raw); err != nil {
		return err
	}
	if raw.Alias != nil {
		*s = *(*ExpressionStatement)(raw.Alias)
	}

	e, err := unmarshalExpression(raw.Expression)
	if err != nil {
		return err
	}
	s.Expression = e
	return nil
}
func (s *ReturnStatement) MarshalJSON() ([]byte, error) {
	type Alias ReturnStatement
	raw := struct {
		Type string `json:"type"`
		*Alias
	}{
		Type:  s.NodeType(),
		Alias: (*Alias)(s),
	}
	return json.Marshal(raw)
}
func (s *ReturnStatement) UnmarshalJSON(data []byte) error {
	type Alias ReturnStatement
	raw := struct {
		*Alias
		Argument json.RawMessage `json:"argument"`
	}{}
	if err := json.Unmarshal(data, &raw); err != nil {
		return err
	}
	if raw.Alias != nil {
		*s = *(*ReturnStatement)(raw.Alias)
	}

	e, err := unmarshalExpression(raw.Argument)
	if err != nil {
		return err
	}
	s.Argument = e
	return nil
}
func (d *NativeVariableAssignment) MarshalJSON() ([]byte, error) {
	type Alias NativeVariableAssignment
	raw := struct {
		Type string `json:"type"`
		*Alias
	}{
		Type:  d.NodeType(),
		Alias: (*Alias)(d),
	}
	return json.Marshal(raw)
}
func (d *NativeVariableAssignment) UnmarshalJSON(data []byte) error {
	type Alias NativeVariableAssignment
	raw := struct {
		*Alias
		Init json.RawMessage `json:"init"`
	}{}
	if err := json.Unmarshal(data, &raw); err != nil {
		return err
	}
	if raw.Alias != nil {
		*d = *(*NativeVariableAssignment)(raw.Alias)
	}

	e, err := unmarshalExpression(raw.Init)
	if err != nil {
		return err
	}
	d.Init = e
	return nil
}
func (d *ExternalVariableAssignment) MarshalJSON() ([]byte, error) {
	return nil, errors.New("cannot marshal ExternalVariableAssignment")
}
func (e *CallExpression) MarshalJSON() ([]byte, error) {
	type Alias CallExpression
	raw := struct {
		Type string `json:"type"`
		*Alias
	}{
		Type:  e.NodeType(),
		Alias: (*Alias)(e),
	}
	return json.Marshal(raw)
}
func (e *CallExpression) UnmarshalJSON(data []byte) error {
	type Alias CallExpression
	raw := struct {
		*Alias
		Callee json.RawMessage `json:"callee"`
	}{}
	if err := json.Unmarshal(data, &raw); err != nil {
		return err
	}
	if raw.Alias != nil {
		*e = *(*CallExpression)(raw.Alias)
	}

	callee, err := unmarshalExpression(raw.Callee)
	if err != nil {
		return err
	}
	e.Callee = callee

	return nil
}
func (e *MemberExpression) MarshalJSON() ([]byte, error) {
	type Alias MemberExpression
	raw := struct {
		Type string `json:"type"`
		*Alias
	}{
		Type:  e.NodeType(),
		Alias: (*Alias)(e),
	}
	return json.Marshal(raw)
}
func (e *MemberExpression) UnmarshalJSON(data []byte) error {
	type Alias MemberExpression
	raw := struct {
		*Alias
		Object json.RawMessage `json:"object"`
	}{}
	if err := json.Unmarshal(data, &raw); err != nil {
		return err
	}
	if raw.Alias != nil {
		*e = *(*MemberExpression)(raw.Alias)
	}

	object, err := unmarshalExpression(raw.Object)
	if err != nil {
		return err
	}
	e.Object = object

	return nil
}
func (e *IndexExpression) MarshalJSON() ([]byte, error) {
	type Alias IndexExpression
	raw := struct {
		Type string `json:"type"`
		*Alias
	}{
		Type:  e.NodeType(),
		Alias: (*Alias)(e),
	}
	return json.Marshal(raw)
}
func (e *IndexExpression) UnmarshalJSON(data []byte) error {
	type Alias IndexExpression
	raw := struct {
		*Alias
		Array json.RawMessage `json:"array"`
		Index json.RawMessage `json:"index"`
	}{}
	if err := json.Unmarshal(data, &raw); err != nil {
		return err
	}
	if raw.Alias != nil {
		*e = *(*IndexExpression)(raw.Alias)
	}

	array, err := unmarshalExpression(raw.Array)
	if err != nil {
		return err
	}
	e.Array = array

	index, err := unmarshalExpression(raw.Index)
	if err != nil {
		return err
	}
	e.Index = index
	return nil
}
func (e *FunctionExpression) MarshalJSON() ([]byte, error) {
	type Alias FunctionExpression
	raw := struct {
		Type string `json:"type"`
		*Alias
	}{
		Type:  e.NodeType(),
		Alias: (*Alias)(e),
	}
	return json.Marshal(raw)
}
func (e *FunctionBlock) MarshalJSON() ([]byte, error) {
	type Alias FunctionBlock
	raw := struct {
		Type string `json:"type"`
		*Alias
	}{
		Type:  e.NodeType(),
		Alias: (*Alias)(e),
	}
	return json.Marshal(raw)
}
func (e *FunctionBlock) UnmarshalJSON(data []byte) error {
	type Alias FunctionBlock
	raw := struct {
		*Alias
		Body json.RawMessage `json:"body"`
	}{}
	if err := json.Unmarshal(data, &raw); err != nil {
		return err
	}
	if raw.Alias != nil {
		*e = *(*FunctionBlock)(raw.Alias)
	}

	body, err := unmarshalNode(raw.Body)
	if err != nil {
		return err
	}
	e.Body = body

	return nil
}
func (e *FunctionParameters) MarshalJSON() ([]byte, error) {
	type Alias FunctionParameters
	raw := struct {
		Type string `json:"type"`
		*Alias
	}{
		Type:  e.NodeType(),
		Alias: (*Alias)(e),
	}
	return json.Marshal(raw)
}
func (e *FunctionParameter) MarshalJSON() ([]byte, error) {
	type Alias FunctionParameter
	raw := struct {
		Type string `json:"type"`
		*Alias
	}{
		Type:  e.NodeType(),
		Alias: (*Alias)(e),
	}
	return json.Marshal(raw)
}
func (e *BinaryExpression) MarshalJSON() ([]byte, error) {
	type Alias BinaryExpression
	raw := struct {
		Type string `json:"type"`
		*Alias
	}{
		Type:  e.NodeType(),
		Alias: (*Alias)(e),
	}
	return json.Marshal(raw)
}
func (e *BinaryExpression) UnmarshalJSON(data []byte) error {
	type Alias BinaryExpression
	raw := struct {
		*Alias
		Left  json.RawMessage `json:"left"`
		Right json.RawMessage `json:"right"`
	}{}
	if err := json.Unmarshal(data, &raw); err != nil {
		return err
	}
	if raw.Alias != nil {
		*e = *(*BinaryExpression)(raw.Alias)
	}

	l, err := unmarshalExpression(raw.Left)
	if err != nil {
		return err
	}
	e.Left = l

	r, err := unmarshalExpression(raw.Right)
	if err != nil {
		return err
	}
	e.Right = r
	return nil
}
func (e *UnaryExpression) MarshalJSON() ([]byte, error) {
	type Alias UnaryExpression
	raw := struct {
		Type string `json:"type"`
		*Alias
	}{
		Type:  e.NodeType(),
		Alias: (*Alias)(e),
	}
	return json.Marshal(raw)
}
func (e *UnaryExpression) UnmarshalJSON(data []byte) error {
	type Alias UnaryExpression
	raw := struct {
		*Alias
		Argument json.RawMessage `json:"argument"`
	}{}
	if err := json.Unmarshal(data, &raw); err != nil {
		return err
	}
	if raw.Alias != nil {
		*e = *(*UnaryExpression)(raw.Alias)
	}

	argument, err := unmarshalExpression(raw.Argument)
	if err != nil {
		return err
	}
	e.Argument = argument

	return nil
}
func (e *LogicalExpression) MarshalJSON() ([]byte, error) {
	type Alias LogicalExpression
	raw := struct {
		Type string `json:"type"`
		*Alias
	}{
		Type:  e.NodeType(),
		Alias: (*Alias)(e),
	}
	return json.Marshal(raw)
}
func (e *LogicalExpression) UnmarshalJSON(data []byte) error {
	type Alias LogicalExpression
	raw := struct {
		*Alias
		Left  json.RawMessage `json:"left"`
		Right json.RawMessage `json:"right"`
	}{}
	if err := json.Unmarshal(data, &raw); err != nil {
		return err
	}
	if raw.Alias != nil {
		*e = *(*LogicalExpression)(raw.Alias)
	}

	l, err := unmarshalExpression(raw.Left)
	if err != nil {
		return err
	}
	e.Left = l

	r, err := unmarshalExpression(raw.Right)
	if err != nil {
		return err
	}
	e.Right = r
	return nil
}
func (e *ArrayExpression) MarshalJSON() ([]byte, error) {
	type Alias ArrayExpression
	raw := struct {
		Type string `json:"type"`
		*Alias
	}{
		Type:  e.NodeType(),
		Alias: (*Alias)(e),
	}
	return json.Marshal(raw)
}
func (e *ArrayExpression) UnmarshalJSON(data []byte) error {
	type Alias ArrayExpression
	raw := struct {
		*Alias
		Elements []json.RawMessage `json:"elements"`
	}{}
	if err := json.Unmarshal(data, &raw); err != nil {
		return err
	}
	if raw.Alias != nil {
		*e = *(*ArrayExpression)(raw.Alias)
	}

	e.Elements = make([]Expression, len(raw.Elements))
	for i, r := range raw.Elements {
		expr, err := unmarshalExpression(r)
		if err != nil {
			return err
		}
		e.Elements[i] = expr
	}
	return nil
}
func (e *ObjectExpression) MarshalJSON() ([]byte, error) {
	type Alias ObjectExpression
	raw := struct {
		Type string `json:"type"`
		*Alias
	}{
		Type:  e.NodeType(),
		Alias: (*Alias)(e),
	}
	return json.Marshal(raw)
}
func (e *ConditionalExpression) MarshalJSON() ([]byte, error) {
	type Alias ConditionalExpression
	raw := struct {
		Type string `json:"type"`
		*Alias
	}{
		Type:  e.NodeType(),
		Alias: (*Alias)(e),
	}
	return json.Marshal(raw)
}
func (e *ConditionalExpression) UnmarshalJSON(data []byte) error {
	type Alias ConditionalExpression
	raw := struct {
		*Alias
		Test       json.RawMessage `json:"test"`
		Alternate  json.RawMessage `json:"alternate"`
		Consequent json.RawMessage `json:"consequent"`
	}{}
	if err := json.Unmarshal(data, &raw); err != nil {
		return err
	}
	if raw.Alias != nil {
		*e = *(*ConditionalExpression)(raw.Alias)
	}

	test, err := unmarshalExpression(raw.Test)
	if err != nil {
		return err
	}
	e.Test = test

	alternate, err := unmarshalExpression(raw.Alternate)
	if err != nil {
		return err
	}
	e.Alternate = alternate

	consequent, err := unmarshalExpression(raw.Consequent)
	if err != nil {
		return err
	}
	e.Consequent = consequent
	return nil
}
func (p *Property) MarshalJSON() ([]byte, error) {
	type Alias Property
	raw := struct {
		Type string `json:"type"`
		*Alias
	}{
		Type:  p.NodeType(),
		Alias: (*Alias)(p),
	}
	return json.Marshal(raw)
}
func (p *Property) UnmarshalJSON(data []byte) error {
	type Alias Property
	raw := struct {
		*Alias
		Key   json.RawMessage `json:"key"`
		Value json.RawMessage `json:"value"`
	}{}
	if err := json.Unmarshal(data, &raw); err != nil {
		return err
	}
	if raw.Alias != nil {
		*p = *(*Property)(raw.Alias)
	}

	key, err := unmarshalPropertyKey(raw.Key)
	if err != nil {
		return err
	}
	p.Key = key

	if raw.Value != nil {
		value, err := unmarshalExpression(raw.Value)
		if err != nil {
			return err
		}
		p.Value = value
	}
	return nil
}
func (e *IdentifierExpression) MarshalJSON() ([]byte, error) {
	type Alias IdentifierExpression
	raw := struct {
		Type string `json:"type"`
		*Alias
	}{
		Type:  e.NodeType(),
		Alias: (*Alias)(e),
	}
	return json.Marshal(raw)
}
func (i *Identifier) MarshalJSON() ([]byte, error) {
	type Alias Identifier
	raw := struct {
		Type string `json:"type"`
		*Alias
	}{
		Type:  i.NodeType(),
		Alias: (*Alias)(i),
	}
	return json.Marshal(raw)
}
func (l *StringLiteral) MarshalJSON() ([]byte, error) {
	type Alias StringLiteral
	raw := struct {
		Type string `json:"type"`
		*Alias
	}{
		Type:  l.NodeType(),
		Alias: (*Alias)(l),
	}
	return json.Marshal(raw)
}
func (l *BooleanLiteral) MarshalJSON() ([]byte, error) {
	type Alias BooleanLiteral
	raw := struct {
		Type string `json:"type"`
		*Alias
	}{
		Type:  l.NodeType(),
		Alias: (*Alias)(l),
	}
	return json.Marshal(raw)
}
func (l *FloatLiteral) MarshalJSON() ([]byte, error) {
	type Alias FloatLiteral
	raw := struct {
		Type string `json:"type"`
		*Alias
	}{
		Type:  l.NodeType(),
		Alias: (*Alias)(l),
	}
	return json.Marshal(raw)
}
func (l *IntegerLiteral) MarshalJSON() ([]byte, error) {
	type Alias IntegerLiteral
	raw := struct {
		Type string `json:"type"`
		*Alias
		Value string `json:"value"`
	}{
		Type:  l.NodeType(),
		Alias: (*Alias)(l),
		Value: strconv.FormatInt(l.Value, 10),
	}
	return json.Marshal(raw)
}
func (l *IntegerLiteral) UnmarshalJSON(data []byte) error {
	type Alias IntegerLiteral
	raw := struct {
		*Alias
		Value string `json:"value"`
	}{}
	if err := json.Unmarshal(data, &raw); err != nil {
		return err
	}

	if raw.Alias != nil {
		*l = *(*IntegerLiteral)(raw.Alias)
	}

	value, err := strconv.ParseInt(raw.Value, 10, 64)
	if err != nil {
		return err
	}
	l.Value = value
	return nil
}
func (l *UnsignedIntegerLiteral) MarshalJSON() ([]byte, error) {
	type Alias UnsignedIntegerLiteral
	raw := struct {
		Type string `json:"type"`
		*Alias
		Value string `json:"value"`
	}{
		Type:  l.NodeType(),
		Alias: (*Alias)(l),
		Value: strconv.FormatUint(l.Value, 10),
	}
	return json.Marshal(raw)
}
func (l *UnsignedIntegerLiteral) UnmarshalJSON(data []byte) error {
	type Alias UnsignedIntegerLiteral
	raw := struct {
		*Alias
		Value string `json:"value"`
	}{}
	if err := json.Unmarshal(data, &raw); err != nil {
		return err
	}

	if raw.Alias != nil {
		*l = *(*UnsignedIntegerLiteral)(raw.Alias)
	}

	value, err := strconv.ParseUint(raw.Value, 10, 64)
	if err != nil {
		return err
	}
	l.Value = value
	return nil
}
func (l *RegexpLiteral) MarshalJSON() ([]byte, error) {
	type Alias RegexpLiteral
	raw := struct {
		Type string `json:"type"`
		*Alias
		Value string `json:"value"`
	}{
		Type:  l.NodeType(),
		Alias: (*Alias)(l),
		Value: l.Value.String(),
	}
	return json.Marshal(raw)
}
func (l *RegexpLiteral) UnmarshalJSON(data []byte) error {
	type Alias RegexpLiteral
	raw := struct {
		*Alias
		Value string `json:"value"`
	}{}
	if err := json.Unmarshal(data, &raw); err != nil {
		return err
	}

	if raw.Alias != nil {
		*l = *(*RegexpLiteral)(raw.Alias)
	}

	value, err := regexp.Compile(raw.Value)
	if err != nil {
		return err
	}
	l.Value = value
	return nil
}
func (l *DurationLiteral) MarshalJSON() ([]byte, error) {
	type Alias DurationLiteral
	raw := struct {
		Type string `json:"type"`
		*Alias
		Value string `json:"value"`
	}{
		Type:  l.NodeType(),
		Alias: (*Alias)(l),
		Value: l.Value.String(),
	}
	return json.Marshal(raw)
}
func (l *DurationLiteral) UnmarshalJSON(data []byte) error {
	type Alias DurationLiteral
	raw := struct {
		*Alias
		Value string `json:"value"`
	}{}
	if err := json.Unmarshal(data, &raw); err != nil {
		return err
	}

	if raw.Alias != nil {
		*l = *(*DurationLiteral)(raw.Alias)
	}

	value, err := time.ParseDuration(raw.Value)
	if err != nil {
		return err
	}
	l.Value = value
	return nil
}

func (l *DateTimeLiteral) MarshalJSON() ([]byte, error) {
	type Alias DateTimeLiteral
	raw := struct {
		Type string `json:"type"`
		*Alias
	}{
		Type:  l.NodeType(),
		Alias: (*Alias)(l),
	}
	return json.Marshal(raw)
}

func checkNullMsg(msg json.RawMessage) bool {
	switch len(msg) {
	case 0:
		return true
	case 4:
		return string(msg) == "null"
	default:
		return false
	}
}
func unmarshalStatement(msg json.RawMessage) (Statement, error) {
	if checkNullMsg(msg) {
		return nil, nil
	}
	n, err := unmarshalNode(msg)
	if err != nil {
		return nil, err
	}
	s, ok := n.(Statement)
	if !ok {
		return nil, fmt.Errorf("node %q is not a statement", n.NodeType())
	}
	return s, nil
}
func unmarshalExpression(msg json.RawMessage) (Expression, error) {
	if checkNullMsg(msg) {
		return nil, nil
	}
	n, err := unmarshalNode(msg)
	if err != nil {
		return nil, err
	}
	e, ok := n.(Expression)
	if !ok {
		return nil, fmt.Errorf("node %q is not an expression", n.NodeType())
	}
	return e, nil
}
func unmarshalPropertyKey(msg json.RawMessage) (PropertyKey, error) {
	if checkNullMsg(msg) {
		return nil, nil
	}
	n, err := unmarshalNode(msg)
	if err != nil {
		return nil, err
	}
	k, ok := n.(PropertyKey)
	if !ok {
		return nil, fmt.Errorf("node %q is not property key", n.NodeType())
	}
	return k, nil
}
func unmarshalVariableAssignment(msg json.RawMessage) (Node, error) {
	if checkNullMsg(msg) {
		return nil, nil
	}
	n, err := unmarshalNode(msg)
	if err != nil {
		return nil, err
	}
	switch n.(type) {
	case *ExternalVariableAssignment,
		*NativeVariableAssignment:
		return n, nil
	default:
		return nil, fmt.Errorf("node %q is not a variable declaration", n.NodeType())
	}
}
func unmarshalNode(msg json.RawMessage) (Node, error) {
	if checkNullMsg(msg) {
		return nil, nil
	}

	type typeRawMessage struct {
		Type string `json:"type"`
	}

	typ := typeRawMessage{}
	if err := json.Unmarshal(msg, &typ); err != nil {
		return nil, err
	}

	var node Node
	switch typ.Type {
	case "Program":
		node = new(Program)
	case "PackageClause":
		node = new(PackageClause)
	case "ImportDeclaration":
		node = new(ImportDeclaration)
	case "Block":
		node = new(Block)
	case "OptionStatement":
		node = new(OptionStatement)
	case "ExpressionStatement":
		node = new(ExpressionStatement)
	case "ReturnStatement":
		node = new(ReturnStatement)
	case "NativeVariableAssignment":
		node = new(NativeVariableAssignment)
	case "CallExpression":
		node = new(CallExpression)
	case "MemberExpression":
		node = new(MemberExpression)
	case "IndexExpression":
		node = new(IndexExpression)
	case "BinaryExpression":
		node = new(BinaryExpression)
	case "UnaryExpression":
		node = new(UnaryExpression)
	case "LogicalExpression":
		node = new(LogicalExpression)
	case "ObjectExpression":
		node = new(ObjectExpression)
	case "ConditionalExpression":
		node = new(ConditionalExpression)
	case "ArrayExpression":
		node = new(ArrayExpression)
	case "Identifier":
		node = new(Identifier)
	case "IdentifierExpression":
		node = new(IdentifierExpression)
	case "StringLiteral":
		node = new(StringLiteral)
	case "BooleanLiteral":
		node = new(BooleanLiteral)
	case "FloatLiteral":
		node = new(FloatLiteral)
	case "IntegerLiteral":
		node = new(IntegerLiteral)
	case "UnsignedIntegerLiteral":
		node = new(UnsignedIntegerLiteral)
	case "RegexpLiteral":
		node = new(RegexpLiteral)
	case "DurationLiteral":
		node = new(DurationLiteral)
	case "DateTimeLiteral":
		node = new(DateTimeLiteral)
	case "FunctionExpression":
		node = new(FunctionExpression)
	case "FunctionBlock":
		node = new(FunctionBlock)
	case "FunctionParameters":
		node = new(FunctionParameters)
	case "FunctionParameter":
		node = new(FunctionParameter)
	case "Property":
		node = new(Property)
	default:
		return nil, fmt.Errorf("unknown type %q", typ.Type)
	}

	if err := json.Unmarshal(msg, node); err != nil {
		return nil, err
	}
	return node, nil
}
func UnmarshalNode(data []byte) (Node, error) {
	return unmarshalNode((json.RawMessage)(data))
}
