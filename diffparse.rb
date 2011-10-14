def parse(diff)
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
