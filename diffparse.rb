module DiffParsing
    def DiffParsing.parse(format, diff)
        if format == :unified
            parse_unified_diff(diff)
        elsif format == :word
            parse_word_diff(diff)
        else
            { :content => diff, :type => raw }
        end
    end

    def DiffParsing.parse_word_diff(diff)
        snippets = []
    
        in_addition = false
        in_subtraction = false
        diff.each_line do |line|
            if line.start_with? 'diff'
                snippets << { :content => line, :type => :header }
            elsif line.start_with? 'index' or
                  line.start_with? '---' or
                  line.start_with? '+++'
                snippets[-1][:content] += line
            elsif line.start_with? '@@'
                snippets << { :content => line, :type => :separator }
            else
                if snippets[-1][:type] == :separator
                    snippets << { :content => '', :type => :raw }
                end
                skip = false
                line.chars().zip(line[1..-1].chars()).each do |char, next_char|
                    if skip
                        skip = false
                    elsif char == '{' and
                       next_char == '+' and
                       not in_addition and
                       not in_subtraction
                        in_addition = true
                        snippets << { :content => char, :type => :addition }
                    elsif char == '+' and
                          next_char == '}' and
                          in_addition
                        in_addition = false
                        snippets[-1][:content] += '+}'
                        snippets << { :content => '', :type => :raw }
                        skip = true
                    elsif char == '[' and
                          next_char == '-' and
                          not in_addition and
                          not in_subtraction
                        in_subtraction = true
                        snippets << { :content => char, :type => :subtraction }
                    elsif char == '-' and
                          next_char == ']' and
                          in_subtraction
                        in_subtraction = false
                        snippets[-1][:content] += '-]'
                        snippets << { :content => '', :type => :raw }
                        skip = true
                    else
                        snippets[-1][:content] += char
                    end
                end
            end
        end

        snippets
    end

    def DiffParsing.parse_unified_diff(diff)
        header_prefixes = ['old mode', 'new mode', 'deleted file mode',
                           'new file mode', 'copy from', 'copy to',
                           'index', '---', '+++']

        snippets = []
        diff.each_line do |line|
            if line.start_with?('diff')
                ensure_separator(snippets)
                snippet = Hash.new do |hash, key|
                    case (key)
                        when (:visible1) then hash[key] = get_line(hash[:content], 0)
                        when (:visible2) then hash[key] = get_line(hash[:content], 1)
                        else nil
                    end
                end
                snippet[:content] = line
                snippet[:type] = :header
                snippets << snippet
            elsif line=~ /similarity index (\d+)%/
                snippets[-1][:content] += line
                snippets[-1][:similarity] = $1
            elsif line=~ /dissimilarity index (\d+)%/
                snippets[-1][:content] += line
                snippets[-1][:dissimilarity] = $1
            elsif line =~ /rename (from .*)/
                snippets[-1][:content] += line
                snippets[-1][:visible1] = rename_header($1,snippets[-1])
            elsif line =~ /rename to (.*)/
                snippets[-1][:content] += line
                # adding 2 spaces so that it's the same width as from
                snippets[-1][:visible2] = rename_header("to   #{$1}",snippets[-1])
            elsif line.start_with?(*header_prefixes)
                snippets[-1][:content] += line
            elsif line.start_with?('@@')
                snippets << { :content => line, :type => :separator }
            elsif line.start_with?('+')
                ensure_separator(snippets)
                snippets << { :content => line, :type => :addition }
            elsif line.start_with?('-')
                ensure_separator(snippets)
                snippets << { :content => line, :type => :subtraction }
            else
                ensure_separator(snippets)
                snippets << { :content => line, :type => :raw }
            end
        end
        snippets
    end

    def DiffParsing.ensure_separator(snippets)
        if (snippets.nil? or snippets.empty?)
            return
        end
        if (snippets[-1][:type] == :header) then
            snippets << { :content => " ", :type => :separator }
        end
    end

    def DiffParsing.get_line(string, index)
        return nil if (string.nil?)
        i = 0
        retline = nil
        string.lines do |line|
            retline = line if i==index
            i = i + 1
        end
        return retline
    end

    def DiffParsing.rename_header(line_end,snippet)
        sim = ""
        if snippet.has_key?(:similarity) then
            sim = "(#{snippet[:similarity]}% similar)"
        end
        dis = ""
        if snippet.has_key?(:dissimilarity) then
            dis = "(#{snippet[:dissimilarity]}% dissimilar)"
        end
        # I'm assuming here that you will only have similarity or dissimilarity
        return "rename #{sim}#{dis} #{line_end}"
    end

end
