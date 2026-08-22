# Baseline `.editorconfig`

Industry-default starting point for a C#/.NET repository. Write it to the repository root. Replace `warning` with `error` when the user chose strict enforcement.

```ini
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true
indent_style = space
indent_size = 4

[*.{json,yml,yaml,md,xml,props,targets,csproj,sln}]
indent_size = 2

[*.md]
trim_trailing_whitespace = false

[*.cs]
# Organization
dotnet_sort_system_directives_first = true
dotnet_separate_import_directive_groups = false
csharp_using_directive_placement = outside_namespace:warning
csharp_style_namespace_declarations = file_scoped:warning

# this. qualification
dotnet_style_qualification_for_field = false:warning
dotnet_style_qualification_for_property = false:warning
dotnet_style_qualification_for_method = false:warning
dotnet_style_qualification_for_event = false:warning

# Language keywords over BCL types
dotnet_style_predefined_type_for_locals_parameters_members = true:warning
dotnet_style_predefined_type_for_member_access = true:warning

# Modifiers
dotnet_style_require_accessibility_modifiers = for_non_interface_members:warning
csharp_preferred_modifier_order = public,private,protected,internal,file,static,extern,new,virtual,abstract,sealed,override,readonly,unsafe,required,volatile,async:warning
dotnet_style_readonly_field = true:warning
csharp_prefer_static_local_function = true:warning

# var
csharp_style_var_for_built_in_types = true:suggestion
csharp_style_var_when_type_is_apparent = true:suggestion
csharp_style_var_elsewhere = false:suggestion

# Expression-bodied members
csharp_style_expression_bodied_methods = when_on_single_line:suggestion
csharp_style_expression_bodied_constructors = false:suggestion
csharp_style_expression_bodied_properties = true:suggestion
csharp_style_expression_bodied_indexers = true:suggestion
csharp_style_expression_bodied_accessors = true:suggestion
csharp_style_expression_bodied_lambdas = true:suggestion
csharp_style_expression_bodied_local_functions = when_on_single_line:suggestion

# Pattern matching and null handling
csharp_style_pattern_matching_over_is_with_cast_check = true:warning
csharp_style_pattern_matching_over_as_with_null_check = true:warning
csharp_style_prefer_not_pattern = true:warning
csharp_style_prefer_switch_expression = true:suggestion
csharp_style_throw_expression = true:suggestion
csharp_style_conditional_delegate_call = true:warning
dotnet_style_coalesce_expression = true:warning
dotnet_style_null_propagation = true:warning
dotnet_style_prefer_is_null_check_over_reference_equality_method = true:warning

# Expression-level preferences
dotnet_style_object_initializer = true:suggestion
dotnet_style_collection_initializer = true:suggestion
dotnet_style_prefer_collection_expression = when_types_loosely_match:suggestion
dotnet_style_explicit_tuple_names = true:warning
dotnet_style_prefer_auto_properties = true:warning
dotnet_style_prefer_compound_assignment = true:suggestion
dotnet_style_prefer_conditional_expression_over_assignment = true:suggestion
dotnet_style_prefer_conditional_expression_over_return = true:suggestion
csharp_prefer_simple_default_expression = true:warning
csharp_style_inlined_variable_declaration = true:suggestion
csharp_style_deconstructed_variable_declaration = true:suggestion
csharp_style_prefer_index_operator = true:suggestion
csharp_style_prefer_range_operator = true:suggestion
csharp_style_prefer_primary_constructors = true:suggestion
csharp_style_unused_value_expression_statement_preference = discard_variable:suggestion
csharp_style_unused_value_assignment_preference = discard_variable:suggestion

# Braces and blocks
csharp_prefer_braces = true:warning
csharp_prefer_simple_using_statement = true:suggestion

# New-line preferences
csharp_new_line_before_open_brace = all
csharp_new_line_before_else = true
csharp_new_line_before_catch = true
csharp_new_line_before_finally = true
csharp_new_line_before_members_in_object_initializers = true
csharp_new_line_before_members_in_anonymous_types = true
csharp_new_line_between_query_expression_clauses = true

# Indentation and spacing
csharp_indent_case_contents = true
csharp_indent_switch_labels = true
csharp_indent_labels = one_less_than_current
csharp_indent_block_contents = true
csharp_indent_braces = false
csharp_space_after_cast = false
csharp_space_after_keywords_in_control_flow_statements = true
csharp_space_between_method_declaration_parameter_list_parentheses = false
csharp_space_between_method_call_parameter_list_parentheses = false
csharp_space_before_colon_in_inheritance_clause = true
csharp_space_after_colon_in_inheritance_clause = true
csharp_space_around_binary_operators = before_and_after
csharp_preserve_single_line_statements = false
csharp_preserve_single_line_blocks = true

# Formatting must be enforceable
dotnet_diagnostic.IDE0055.severity = warning

# Naming: interfaces are IPascalCase
dotnet_naming_rule.interfaces_should_be_prefixed.severity = warning
dotnet_naming_rule.interfaces_should_be_prefixed.symbols = interface_symbols
dotnet_naming_rule.interfaces_should_be_prefixed.style = i_pascal_case
dotnet_naming_symbols.interface_symbols.applicable_kinds = interface
dotnet_naming_style.i_pascal_case.required_prefix = I
dotnet_naming_style.i_pascal_case.capitalization = pascal_case

# Naming: types and members are PascalCase
dotnet_naming_rule.types_and_members_pascal_case.severity = warning
dotnet_naming_rule.types_and_members_pascal_case.symbols = type_and_member_symbols
dotnet_naming_rule.types_and_members_pascal_case.style = pascal_case
dotnet_naming_symbols.type_and_member_symbols.applicable_kinds = class,struct,enum,delegate,method,property,event,namespace
dotnet_naming_style.pascal_case.capitalization = pascal_case

# Naming: private fields are _camelCase
dotnet_naming_rule.private_fields_underscore_camel_case.severity = warning
dotnet_naming_rule.private_fields_underscore_camel_case.symbols = private_field_symbols
dotnet_naming_rule.private_fields_underscore_camel_case.style = underscore_camel_case
dotnet_naming_symbols.private_field_symbols.applicable_kinds = field
dotnet_naming_symbols.private_field_symbols.applicable_accessibilities = private
dotnet_naming_style.underscore_camel_case.required_prefix = _
dotnet_naming_style.underscore_camel_case.capitalization = camel_case

# Naming: constants are PascalCase
dotnet_naming_rule.constants_pascal_case.severity = warning
dotnet_naming_rule.constants_pascal_case.symbols = constant_symbols
dotnet_naming_rule.constants_pascal_case.style = pascal_case
dotnet_naming_symbols.constant_symbols.applicable_kinds = field,local
dotnet_naming_symbols.constant_symbols.required_modifiers = const

# Naming: parameters and locals are camelCase
dotnet_naming_rule.parameters_and_locals_camel_case.severity = warning
dotnet_naming_rule.parameters_and_locals_camel_case.symbols = parameter_and_local_symbols
dotnet_naming_rule.parameters_and_locals_camel_case.style = camel_case
dotnet_naming_symbols.parameter_and_local_symbols.applicable_kinds = parameter,local
dotnet_naming_style.camel_case.capitalization = camel_case

# Analyzer categories
dotnet_analyzer_diagnostic.category-Style.severity = warning
dotnet_analyzer_diagnostic.category-Naming.severity = warning
dotnet_analyzer_diagnostic.category-Reliability.severity = warning
dotnet_analyzer_diagnostic.category-Security.severity = error
dotnet_analyzer_diagnostic.category-Performance.severity = suggestion

# Generated code
[*.{Designer,g,generated}.cs]
generated_code = true
dotnet_analyzer_diagnostic.severity = none
```

## Optional Test Relaxation

Add only when the user asks for relaxed test projects.

```ini
[tests/**/*.cs]
dotnet_diagnostic.CA1707.severity = none   # underscores in test method names
dotnet_diagnostic.CA1861.severity = none   # constant arrays as arguments
```

## Notes

- `severity` suffixes on style options (`:warning`) drive IDE and, with `EnforceCodeStyleInBuild`, the build.
- `dotnet_analyzer_diagnostic.category-*` covers CA rules; the `IDE*` codes are the style rules.
- `IDE0055` is the single formatting rule; without it, whitespace drift never fails a build.
