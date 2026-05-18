-- Pandoc Lua filter: normalize chapter headings into structured HTML/EPUB output.
--
-- Transforms H1 headings of the form:
--   "Chapter N — Title"
--   "Prologue — Title"
-- into:
--   <h1 class="chapter">
--     <span class="chapter-label">Chapter N</span><br/>
--     <span class="chapter-name">Title</span>
--   </h1>
-- and similarly for Prologue.

local function stringify(inlines)
  return pandoc.utils.stringify(inlines)
end

local function span(class, text)
  return pandoc.Span({ pandoc.Str(text) }, pandoc.Attr("", { class }, {}))
end

local function header_with(label, name, classes)
  local class_list = classes or {}
  table.insert(class_list, "chapter")
  local attr = pandoc.Attr("", class_list, {})
  local content = {
    pandoc.Span({ pandoc.Str(label) }, pandoc.Attr("", { "chapter-label" }, {})),
    pandoc.LineBreak(),
    pandoc.Span({ pandoc.Str(name) }, pandoc.Attr("", { "chapter-name" }, {})),
  }
  return pandoc.Header(1, content, attr)
end

function Header(el)
  if el.level ~= 1 then
    return nil
  end

  local text = stringify(el.content)

  local num, title = text:match("^Chapter%s+(%d+)%s+—%s+(.+)$")
  if num and title then
    return header_with("Chapter " .. num, title)
  end

  local pro_title = text:match("^Prologue%s+—%s+(.+)$")
  if pro_title then
    return header_with("Prologue", pro_title, { "prologue" })
  end

  return nil
end
