require 'json'

module RbConfig
	CONFIG_FILE = 'config.json'

	def RbConfig.parse()
		data = File.open(CONFIG_FILE, 'r').read
		JSON::Ext::Parser.new(data).parse
	end

	def RbConfig.prop(name)
		parse[name.to_s]
	end

	# These are pure sugar, but they're 
	# most of what we really want the
	# config to do, so they might as well 
	# be pretty

	def RbConfig.repo_names()
		prop(:repositories).collect do |repo|
			repo['name']
		end
	end

    def RbConfig.has_repo?(name)
        repo_names().index(name) != nil
    end

	def RbConfig.repo(name)
		matches = prop(:repositories).keep_if { |repo| repo['name'] == name }
		if matches.length > 0
			matches[0]
		else
			raise "No such repository named #{name}"
		end
	end

	def RbConfig.repo_loc(name)
		repo(name)['location']
	end

	def RbConfig.repo_remote?(name)
		repo(name)['use_remote']
	end

	def RbConfig.repo_remote_name(name)
		repo(name)['remote_name']
	end
end