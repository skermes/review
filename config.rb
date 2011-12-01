require 'json'

module Config
	CONFIG_FILE = 'config.json'

	def Config.parse()
		data = File.open(CONFIG_FILE, 'r').read
		JSON::Ext::Parser.new(data).parse
	end

	def Config.prop(name)
		parse[name.to_s]
	end

	# These are pure sugar, but they're 
	# most of what we really want the
	# config to do, so they might as well 
	# be pretty

	def Config.repo_names()
		prop(:repositories).collect do |repo|
			repo['name']
		end
	end

	def Config.repo(name)
		matches = prop(:repositories).keep_if { |repo| repo['name'] == name }
		if matches.length > 0
			matches[0]
		else
			raise "No such repository named #{name}"
		end
	end

	def Config.repo_loc(name)
		repo(name)['location']
	end

	def Config.repo_remote?(name)
		repo(name)['use_remote']
	end

	def Config.repo_remote_name(name)
		repo(name)['remote_name']
	end
end