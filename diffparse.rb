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
                           'rename from', 'rename to', 'similarity index',
                           'dissimilarity index', 'index', '---', '+++']

        snippets = []
        diff.each_line do |line|
            if line.start_with?('diff')
                snippets << { :content => line, :type => :header }
            elsif line.start_with?(*header_prefixes)
                snippets[-1][:content] += line
            elsif line.start_with?('@@')
                snippets << { :content => line, :type => :separator }
            elsif line.start_with?('+')
                snippets << { :content => line, :type => :addition }
            elsif line.start_with?('-')
                snippets << { :content => line, :type => :subtraction }
            else
                snippets << { :content => line, :type => :raw }
            end
        end
        snippets
    end
end
